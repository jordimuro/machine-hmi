import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import logger from '../config/logger.js';
import tagStore from '../stores/tagStore.js';
import alarmStore from '../stores/alarmStore.js';
import historyStore from '../stores/historyStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * OPC UA Client Manager
 * Handles connection, polling, and writing to OPC UA server
 * Falls back to mockup mode if real OPC UA is not available
 */
class OpcuaClient {
  constructor() {
    this.connected = false;
    this.tagsConfig = null;
    this.pollingInterval = null;
    this.loggingInterval = null;
    this.mockMode = false;
    this.mockData = {};
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 60000; // 60 seconds
  }

  /**
   * Initialize the OPC UA client
   */
  async init() {
    try {
      // Load tags configuration
      const tagsConfigPath = join(__dirname, '../../tags.json');
      this.tagsConfig = JSON.parse(readFileSync(tagsConfigPath, 'utf8'));

      logger.info({ tagsCount: Object.keys(this.tagsConfig.tags).length }, 'Tags configuration loaded');

      // Try to connect to real OPC UA server
      await this.connect();
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize OPC UA client');
      throw error;
    }
  }

  /**
   * Connect to OPC UA server with fallback to mock mode
   */
  async connect() {
    try {
      // Try to import node-opcua
      const opcua = await import('node-opcua');

      logger.info({ endpoint: config.opcua.endpoint }, 'Attempting to connect to OPC UA server');

      // Try real OPC UA connection
      await this.connectReal(opcua);

    } catch (error) {
      logger.warn({ err: error }, 'node-opcua not available or connection failed, using mock mode');
      this.enableMockMode();
    }
  }

  /**
   * Connect to real OPC UA server
   */
  async connectReal(opcua) {
    try {
      // Create OPC UA client
      this.client = opcua.OPCUAClient.create({
        applicationName: "Machine HMI Client",
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3
        },
        securityMode: opcua.MessageSecurityMode.None,
        securityPolicy: opcua.SecurityPolicy.None,
        endpoint_must_exist: false
      });

      // Connect to server
      await this.client.connect(config.opcua.endpoint);
      logger.info('Connected to OPC UA server');

      // Create session
      this.session = await this.client.createSession();
      logger.info('OPC UA session created');

      this.connected = true;
      this.mockMode = false;
      this.reconnectAttempts = 0;

      // Notify WebSocket clients of status change
      this.notifyStatusChange();

      // Initialize tag store with initial values
      await this.readAllTags();

      // Start polling and logging
      this.startPolling();
      this.startLogging();

    } catch (error) {
      logger.error({ err: error }, 'Failed to connect to real OPC UA server');
      this.connected = false;
      this.notifyStatusChange();
      throw error;
    }
  }

  /**
   * Read all tags from OPC UA server
   */
  async readAllTags() {
    if (!this.session) return;

    const nodeIds = Object.entries(this.tagsConfig.tags).map(([tagName, tagConfig]) => ({
      tagName,
      nodeId: tagConfig.nodeId
    }));

    // Dividir en lotes más pequeños para el array de motores
    const batchSize = 25; // Reducir tamaño de lote
    const batches = [];
    
    // Separar tags básicos de tags de motores
    const basicTags = nodeIds.filter(({ tagName }) => !tagName.includes('aAxisDiagnostic'));
    const motorTags = nodeIds.filter(({ tagName }) => tagName.includes('aAxisDiagnostic'));
    
    // Procesar tags básicos primero (en un lote)
    if (basicTags.length > 0) {
      batches.push(basicTags);
    }
    
    // Procesar tags de motores en lotes pequeños
    for (let i = 0; i < motorTags.length; i += batchSize) {
      batches.push(motorTags.slice(i, i + batchSize));
    }
    
    logger.info(`Reading ${nodeIds.length} tags in ${batches.length} batches (${basicTags.length} basic, ${motorTags.length} motor tags)`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isMotorBatch = batch.some(({ tagName }) => tagName.includes('aAxisDiagnostic'));
      
      try {
        const nodesToRead = batch.map(({ nodeId }) => ({
          nodeId: nodeId,
          attributeId: 13 // Value attribute
        }));

        const dataValues = await this.session.read(nodesToRead);

        dataValues.forEach((dataValue, index) => {
          const { tagName } = batch[index];
          
          if (dataValue.statusCode.isGood()) {
            const value = dataValue.value.value;
            tagStore.update(tagName, value, 'good');
            logger.debug({ tagName, value }, 'Tag read successfully');
          } else {
            // Para tags de motor que no existen, usar valor por defecto
            if (tagName.includes('aAxisDiagnostic')) {
              tagStore.update(tagName, 0, 'uncertain');
            } else {
              tagStore.update(tagName, null, 'bad');
            }
            logger.debug({ tagName, statusCode: dataValue.statusCode.toString() }, 'Tag read failed');
          }
        });

        // Pequeño delay entre lotes de motores para no saturar el servidor
        if (isMotorBatch && i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

      } catch (error) {
        logger.warn({ err: error, batchSize: batch.length, batchType: isMotorBatch ? 'motor' : 'basic' }, 'Failed to read tag batch from OPC UA server');
        
        // Marcar todos los tags del lote como inciertos
        batch.forEach(({ tagName }) => {
          if (tagName.includes('aAxisDiagnostic')) {
            tagStore.update(tagName, 0, 'uncertain');
          } else {
            tagStore.update(tagName, null, 'bad');
          }
        });
      }
    }
  }

  /**
   * Enable mock mode for testing without real PLC
   */
  enableMockMode() {
    this.mockMode = true;
    this.connected = true;

    // Initialize mock data
    Object.entries(this.tagsConfig.tags).forEach(([tagName, tagConfig]) => {
      if (tagConfig.type === 'boolean') {
        this.mockData[tagName] = false;
      } else if (tagConfig.type === 'number') {
        const min = tagConfig.min || 0;
        const max = tagConfig.max || 100;
        
        // Para tags de motores, generar valores más realistas
        if (tagName.includes('aAxisDiagnostic')) {
          this.mockData[tagName] = this.generateRealisticMotorValue(tagName, tagConfig);
        } else {
          this.mockData[tagName] = min + (max - min) * 0.5; // Start at middle
        }
      } else {
        this.mockData[tagName] = '';
      }

      // Initialize tag store
      tagStore.update(tagName, this.mockData[tagName], 'good');
    });

    logger.info(`Mock OPC UA mode enabled with simulated data for ${Object.keys(this.tagsConfig.tags).length} tags`);

    // Start polling and logging
    this.startPolling();
    this.startLogging();
  }

  /**
   * Generate realistic values for motor diagnostic tags
   */
  generateRealisticMotorValue(tagName, tagConfig) {
    const min = tagConfig.min || 0;
    const max = tagConfig.max || 100;
    
    // Extraer número de motor del nombre del tag
    const motorMatch = tagName.match(/aAxisDiagnostic_(\d+)_/);
    const motorIndex = motorMatch ? parseInt(motorMatch[1]) : 1;
    
    // Generar valores basados en el tipo de variable
    if (tagName.includes('speedAct') || tagName.includes('speedSet')) {
      // Velocidades: algunos motores corriendo, otros parados
      return motorIndex <= 5 ? 1200 + Math.random() * 800 : Math.random() * 100;
    } else if (tagName.includes('torqueAct') || tagName.includes('torqueSet')) {
      // Torques: proporcional a la velocidad
      const speed = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      return speed > 100 ? 20 + Math.random() * 50 : Math.random() * 10;
    } else if (tagName.includes('motorTemp') || tagName.includes('heatsinkTemp')) {
      // Temperaturas: más altas si el motor está corriendo
      const speed = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      return speed > 100 ? 40 + Math.random() * 40 : 20 + Math.random() * 20;
    } else if (tagName.includes('motorLoad') || tagName.includes('inverterLoad')) {
      // Cargas: proporcional a la velocidad
      const speed = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      return speed > 100 ? 30 + Math.random() * 50 : Math.random() * 20;
    } else if (tagName.includes('dcVoltage')) {
      // Voltajes DC: valores típicos
      return 580 + Math.random() * 40;
    } else if (tagName.includes('motorVoltage')) {
      // Voltajes del motor
      return 380 + Math.random() * 40;
    } else if (tagName.includes('motorCurrent')) {
      // Corriente proporcional a la carga
      const load = this.mockData[`aAxisDiagnostic_${motorIndex}_motorLoad`] || 0;
      return (load / 100) * 30 + Math.random() * 5;
    } else if (tagName.includes('Error')) {
      // Errores: ocasionalmente algunos motores con errores
      return Math.random() < 0.1 ? Math.floor(Math.random() * 100) : 0;
    } else if (tagName.includes('status')) {
      // Estados: valores típicos de estado
      return Math.floor(min + Math.random() * (max - min) * 0.1);
    } else {
      // Otros valores: distribución normal
      return min + Math.random() * (max - min);
    }
  }

  /**
   * Start polling tags
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    const pollingRate = this.tagsConfig.pollingRateMs || config.opcua.pollingRateMs;

    this.pollingInterval = setInterval(() => {
      this.pollTags();
    }, pollingRate);

    logger.info({ pollingRateMs: pollingRate }, 'Started tag polling');
  }

  /**
   * Poll all tags
   */
  pollTags() {
    if (!this.connected) {
      return;
    }

    if (this.mockMode) {
      this.pollTagsMock();
    } else {
      this.pollTagsReal();
    }
  }

  /**
   * Poll tags from real OPC UA server
   */
  async pollTagsReal() {
    if (!this.session) return;

    try {
      await this.readAllTags();
    } catch (error) {
      logger.error({ err: error }, 'Error polling tags from OPC UA server');
      
      // If connection lost, try to reconnect
      if (error.message.includes('BadConnectionClosed') || error.message.includes('ECONNRESET')) {
        logger.warn('Connection lost, attempting to reconnect...');
        this.connected = false;
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Poll tags in mock mode with simulated realistic data
   */
  pollTagsMock() {
    Object.entries(this.tagsConfig.tags).forEach(([tagName, tagConfig]) => {
      // Inicializar valor si no existe
      if (this.mockData[tagName] === undefined) {
        if (tagConfig.type === 'boolean') {
          this.mockData[tagName] = false;
        } else if (tagConfig.type === 'number') {
          if (tagName.includes('aAxisDiagnostic')) {
            this.mockData[tagName] = this.generateRealisticMotorValue(tagName, tagConfig);
          } else {
            const min = tagConfig.min || 0;
            const max = tagConfig.max || 100;
            this.mockData[tagName] = min + (max - min) * 0.5;
          }
        } else {
          this.mockData[tagName] = '';
        }
      }

      let newValue = this.mockData[tagName];

      if (tagConfig.type === 'boolean') {
        // Randomly flip booleans occasionally
        if (Math.random() < 0.02) { // 2% chance per poll
          newValue = !newValue;
          this.mockData[tagName] = newValue;
        }
      } else if (tagConfig.type === 'number') {
        // Para tags de motores, usar simulación más realista
        if (tagName.includes('aAxisDiagnostic')) {
          newValue = this.updateMotorTagValue(tagName, tagConfig, newValue);
        } else {
          // Add realistic variation to numbers
          const min = tagConfig.min || 0;
          const max = tagConfig.max || 100;
          const variation = (max - min) * 0.02; // 2% variation

          // Random walk
          newValue += (Math.random() - 0.5) * variation;
          newValue = Math.max(min, Math.min(max, newValue));

          // Simulate production count incrementing
          if (tagName === 'ProductionCount' && this.mockData['MachineRunning']) {
            newValue = Math.floor(newValue + Math.random() * 0.5);
          }
        }

        this.mockData[tagName] = newValue;
      }

      // Update tag store
      tagStore.update(tagName, newValue, 'good');

      // Handle alarm tags
      if (tagConfig.alarm) {
        alarmStore.setAlarm(tagName, newValue === true, tagConfig.message || '');
      }
    });

    // Simulate occasional alarms
    this.simulateAlarms();
  }

  /**
   * Update motor tag values with realistic simulation
   */
  updateMotorTagValue(tagName, tagConfig, currentValue) {
    const min = tagConfig.min || 0;
    const max = tagConfig.max || 100;
    const variation = (max - min) * 0.01; // 1% variation for motors
    
    // Extraer número de motor
    const motorMatch = tagName.match(/aAxisDiagnostic_(\d+)_/);
    const motorIndex = motorMatch ? parseInt(motorMatch[1]) : 1;
    
    // Simular cambios realistas basados en el tipo de variable
    if (tagName.includes('speedAct')) {
      // Velocidad actual: pequeñas variaciones si está corriendo
      if (currentValue > 100) {
        return Math.max(0, currentValue + (Math.random() - 0.5) * 50);
      } else {
        return Math.random() < 0.01 ? 1200 + Math.random() * 800 : currentValue;
      }
    } else if (tagName.includes('speedSet')) {
      // Velocidad de consigna: similar a la actual pero con menos variación
      const speedAct = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      if (speedAct > 100) {
        // Si el motor está corriendo, el setpoint está cerca de la velocidad actual
        return Math.max(0, speedAct + (Math.random() - 0.5) * 100);
      } else {
        // Motor parado, setpoint también bajo
        return Math.random() * 50;
      }
    } else if (tagName.includes('motorTemp') || tagName.includes('heatsinkTemp')) {
      // Temperatura: sigue la velocidad con inercia térmica
      const speed = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      const targetTemp = speed > 100 ? 60 + Math.random() * 30 : 25 + Math.random() * 10;
      return currentValue + (targetTemp - currentValue) * 0.05; // Inercia térmica
    } else if (tagName.includes('motorLoad')) {
      // Carga del motor: proporcional a la velocidad
      const speed = this.mockData[`aAxisDiagnostic_${motorIndex}_speedAct`] || 0;
      const targetLoad = speed > 100 ? 40 + Math.random() * 40 : Math.random() * 10;
      return Math.max(0, Math.min(100, targetLoad + (Math.random() - 0.5) * 10));
    } else {
      // Otros valores: pequeña variación aleatoria
      return Math.max(min, Math.min(max, currentValue + (Math.random() - 0.5) * variation));
    }
  }

  /**
   * Simulate alarms based on process values
   */
  simulateAlarms() {
    const temp1 = this.mockData['TemperatureZone1'];
    const temp2 = this.mockData['TemperatureZone2'];
    const pressure = this.mockData['Pressure'];

    // Temperature alarm
    if (temp1 > 250 || temp2 > 250) {
      if (!this.mockData['Alarm_Overtemp']) {
        this.mockData['Alarm_Overtemp'] = true;
        tagStore.update('Alarm_Overtemp', true, 'good');
        alarmStore.setAlarm('Alarm_Overtemp', true, 'Temperature exceeded safety limit');
      }
    } else {
      if (this.mockData['Alarm_Overtemp']) {
        this.mockData['Alarm_Overtemp'] = false;
        tagStore.update('Alarm_Overtemp', false, 'good');
        alarmStore.setAlarm('Alarm_Overtemp', false, '');
      }
    }

    // Pressure alarm
    if (pressure > 8) {
      if (!this.mockData['Alarm_OverPressure']) {
        this.mockData['Alarm_OverPressure'] = true;
        tagStore.update('Alarm_OverPressure', true, 'good');
        alarmStore.setAlarm('Alarm_OverPressure', true, 'Pressure exceeded safety limit');
      }
    } else {
      if (this.mockData['Alarm_OverPressure']) {
        this.mockData['Alarm_OverPressure'] = false;
        tagStore.update('Alarm_OverPressure', false, 'good');
        alarmStore.setAlarm('Alarm_OverPressure', false, '');
      }
    }
  }

  /**
   * Start periodic logging of loggable tags
   */
  startLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    this.loggingInterval = setInterval(() => {
      this.logTags();
    }, config.logging.logIntervalMs);

    logger.info({ logIntervalMs: config.logging.logIntervalMs }, 'Started tag logging');
  }

  /**
   * Log loggable tags to history
   */
  logTags() {
    const loggableTags = Object.entries(this.tagsConfig.tags)
      .filter(([_, tagConfig]) => tagConfig.loggable)
      .map(([tagName, _]) => tagStore.get(tagName))
      .filter(tag => tag !== undefined);

    if (loggableTags.length > 0) {
      historyStore.logTags(loggableTags);
    }
  }

  /**
   * Write a value to a tag
   */
  async writeTag(tagName, value) {
    const tagConfig = this.tagsConfig.tags[tagName];

    if (!tagConfig) {
      throw new Error(`Tag ${tagName} not found in configuration`);
    }

    if (!tagConfig.writable) {
      throw new Error(`Tag ${tagName} is not writable`);
    }

    // Validate value range
    if (tagConfig.type === 'number') {
      if (tagConfig.min !== undefined && value < tagConfig.min) {
        throw new Error(`Value ${value} below minimum ${tagConfig.min}`);
      }
      if (tagConfig.max !== undefined && value > tagConfig.max) {
        throw new Error(`Value ${value} above maximum ${tagConfig.max}`);
      }
    }

    if (this.mockMode) {
      // Write to mock data
      this.mockData[tagName] = value;
      tagStore.update(tagName, value, 'good');
      logger.info({ tagName, value }, 'Tag written (mock mode)');
      return true;
    } else {
      // Implement real OPC UA write here
      throw new Error('Real OPC UA write not yet implemented');
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(command, params = {}) {
    logger.info({ command, params }, 'Executing command');

    switch (command) {
      case 'START':
        if (this.mockMode) {
          this.mockData['MachineRunning'] = true;
          tagStore.update('MachineRunning', true, 'good');
          logger.info('Machine started (mock mode)');
        }
        break;

      case 'STOP':
        if (this.mockMode) {
          this.mockData['MachineRunning'] = false;
          tagStore.update('MachineRunning', false, 'good');
          logger.info('Machine stopped (mock mode)');
        }
        break;

      case 'RESET_ALARMS':
        alarmStore.clearAll();
        if (this.mockMode) {
          // Reset all alarm tags
          Object.entries(this.tagsConfig.tags).forEach(([tagName, tagConfig]) => {
            if (tagConfig.alarm) {
              this.mockData[tagName] = false;
              tagStore.update(tagName, false, 'good');
            }
          });
        }
        logger.info('Alarms reset');
        break;

      case 'SET_SETPOINT':
        if (params.tag && params.value !== undefined) {
          await this.writeTag(params.tag, params.value);
        } else {
          throw new Error('SET_SETPOINT requires tag and value parameters');
        }
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    return { success: true, command, params };
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    logger.info({ delay, attempt: this.reconnectAttempts }, 'Scheduling reconnection attempt');

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error({ err: error }, 'Reconnection attempt failed');
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Browse OPC UA server nodes with hierarchical navigation
   */
  async browseNodes(nodeId = 'RootFolder', options = {}) {
    if (!this.session || this.mockMode) {
      return { error: 'No active OPC UA session or in mock mode' };
    }

    const {
      recursive = true,
      maxDepth = 5,
      currentDepth = 0,
      includeObjects = true,
      variablesOnly = false,
      expandArrays = false
    } = options;

    try {
      const browseResult = await this.session.browse(nodeId);
      const nodes = [];
      const variables = [];

      if (browseResult.references) {
        for (const ref of browseResult.references) {
          const node = {
            nodeId: ref.nodeId.toString(),
            browseName: ref.browseName.toString(),
            displayName: ref.displayName?.text || ref.browseName.toString(),
            nodeClass: ref.nodeClass,
            typeDefinition: ref.typeDefinition?.toString(),
            isVariable: ref.nodeClass === 2, // NodeClass.Variable = 2
            isObject: ref.nodeClass === 1,   // NodeClass.Object = 1
            depth: currentDepth,
            path: this.buildNodePath(nodeId, ref.browseName.toString())
          };

          // Si es una variable, obtener información adicional
          if (node.isVariable) {
            try {
              const dataValue = await this.session.readVariableValue(ref.nodeId);
              node.dataType = this.getDataTypeName(dataValue.dataType);
              node.value = dataValue.value?.value;
              node.quality = dataValue.statusCode?.name || 'Unknown';
              node.accessible = true;
              variables.push(node);
            } catch (readError) {
              node.accessible = false;
              node.error = readError.message;
              // Aún agregar variables no accesibles para mostrar en la UI
              variables.push(node);
            }
          }

          // Agregar nodos según las opciones
          if (!variablesOnly || node.isVariable) {
            nodes.push(node);
          }

          // Explorar recursivamente objetos si no hemos alcanzado la profundidad máxima
          if (recursive && currentDepth < maxDepth && node.isObject) {
            try {
              const childResult = await this.browseNodes(
                ref.nodeId.toString(), 
                { ...options, currentDepth: currentDepth + 1 }
              );
              if (childResult.nodes) {
                nodes.push(...childResult.nodes);
                variables.push(...childResult.variables || []);
              }
            } catch (childError) {
              logger.warn({ err: childError, nodeId: ref.nodeId.toString() }, 'Failed to browse child nodes');
            }
          }
        }
      }

      return { 
        nodes: variablesOnly ? variables : nodes,
        variables,
        count: variablesOnly ? variables.length : nodes.length,
        variableCount: variables.length,
        totalScanned: nodes.length,
        depth: currentDepth
      };
    } catch (error) {
      logger.error({ err: error, nodeId }, 'Failed to browse nodes');
      return { error: error.message };
    }
  }

  /**
   * Browse specifically for CODESYS Application variables with array expansion
   */
  async browseApplicationVariables() {
    const commonPaths = [
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application',
      'ns=4;s=Application'
    ];

    let allVariables = [];

    // Intentar diferentes rutas comunes para CODESYS
    for (const path of commonPaths) {
      try {
        const result = await this.browseNodes(path, { 
          recursive: true, 
          maxDepth: 4, 
          variablesOnly: true,
          expandArrays: true
        });
        
        if (result.variables && result.variables.length > 0) {
          allVariables.push(...result.variables);
        }
      } catch (error) {
        logger.debug({ path, err: error }, 'Failed to browse path');
      }
    }

    // Si no encontramos variables en rutas específicas, hacer búsqueda general
    if (allVariables.length === 0) {
      try {
        const result = await this.browseNodes('RootFolder', { 
          recursive: true, 
          maxDepth: 6, 
          variablesOnly: true,
          expandArrays: true
        });
        allVariables = result.variables || [];
      } catch (error) {
        logger.error({ err: error }, 'Failed general browse');
      }
    }

    // Expandir arrays manualmente si no se expandieron automáticamente
    const expandedVariables = [];
    for (const variable of allVariables) {
      expandedVariables.push(variable);
      
      // Si es un array, intentar expandir sus elementos
      if (this.isArrayVariable(variable)) {
        const arrayElements = await this.expandArrayVariable(variable);
        expandedVariables.push(...arrayElements);
      }
    }

    // Filtrar variables que parecen ser de aplicación
    const applicationVariables = expandedVariables.filter(variable => {
      const nodeId = variable.nodeId.toLowerCase();
      const displayName = variable.displayName.toLowerCase();
      
      return nodeId.includes('application') || 
             nodeId.includes('gvl') ||
             displayName.includes('actualspeed') ||
             displayName.includes('randomvalues') ||
             displayName.includes('[') || // Elementos de array
             variable.accessible;
    });

    return {
      nodes: applicationVariables,
      variables: applicationVariables,
      count: applicationVariables.length,
      totalScanned: expandedVariables.length
    };
  }

  /**
   * Check if a variable is an array
   */
  isArrayVariable(variable) {
    const displayName = variable.displayName.toLowerCase();
    const nodeId = variable.nodeId.toLowerCase();
    
    // Detectar arrays por nombre o estructura
    return (displayName.includes('randomvalues') || 
            displayName.includes('motor') || 
            displayName.includes('diagnostic') ||
            displayName.includes('array') ||
            nodeId.includes('array')) && 
           !variable.displayName.includes('[');
  }

  /**
   * Expand array variable to show individual elements
   */
  async expandArrayVariable(arrayVariable) {
    const elements = [];
    const baseName = arrayVariable.displayName;
    const baseNodeId = arrayVariable.nodeId;
    const lowerName = baseName.toLowerCase();
    
    // Determinar el rango del array basado en el nombre
    let arraySize = 20; // Default
    let startIndex = 0;
    
    if (lowerName.includes('randomvalues')) {
      arraySize = 20;
      startIndex = 1; // RandomValues suele empezar en 1
    } else if (lowerName.includes('motor') || lowerName.includes('diagnostic')) {
      arraySize = 20; // Array de 20 motores
      startIndex = 0; // Los arrays de objetos suelen empezar en 0
    }
    
    // Intentar diferentes formatos de indexación
    const indexFormats = [
      (i) => `[${i}]`,           // [0], [1], [2]...
      (i) => `_${i}`,            // _0, _1, _2...
      (i) => `.${i}`,            // .0, .1, .2...
    ];
    
    for (let i = startIndex; i < startIndex + arraySize; i++) {
      let elementFound = false;
      
      // Probar diferentes formatos de indexación
      for (const formatFunc of indexFormats) {
        try {
          const indexSuffix = formatFunc(i);
          const elementNodeId = `${baseNodeId}${indexSuffix}`;
          
          // Intentar leer el valor del elemento
          const dataValue = await this.session.readVariableValue(elementNodeId);
          
          elements.push({
            nodeId: elementNodeId,
            browseName: `${baseName}${indexSuffix}`,
            displayName: `${baseName}${indexSuffix}`,
            nodeClass: 2, // Variable
            isVariable: true,
            isArrayElement: true,
            arrayIndex: i,
            parentArray: baseName,
            dataType: this.getDataTypeName(dataValue.dataType),
            value: dataValue.value?.value,
            quality: dataValue.statusCode?.name || 'Unknown',
            accessible: true,
            depth: (arrayVariable.depth || 0) + 1,
            path: `${arrayVariable.path || baseName}${indexSuffix}`
          });
          
          elementFound = true;
          break; // Si encontramos el elemento con este formato, no probar otros
        } catch (error) {
          // Continuar con el siguiente formato
          continue;
        }
      }
      
      // Si no se encontró el elemento con ningún formato, intentar explorar como objeto
      if (!elementFound) {
        try {
          const objectNodeId = `${baseNodeId}[${i}]`;
          const objectElements = await this.expandObjectMembers(objectNodeId, baseName, i, arrayVariable.depth);
          elements.push(...objectElements);
        } catch (error) {
          // Si tampoco funciona como objeto, agregar como no accesible
          elements.push({
            nodeId: `${baseNodeId}[${i}]`,
            browseName: `${baseName}[${i}]`,
            displayName: `${baseName}[${i}]`,
            nodeClass: 2,
            isVariable: true,
            isArrayElement: true,
            arrayIndex: i,
            parentArray: baseName,
            accessible: false,
            error: 'Element not accessible',
            depth: (arrayVariable.depth || 0) + 1,
            path: `${arrayVariable.path || baseName}[${i}]`
          });
        }
      }
    }
    
    return elements;
  }

  /**
   * Expand object members (for array of objects like motor diagnostics)
   */
  async expandObjectMembers(objectNodeId, parentArrayName, arrayIndex, parentDepth = 0) {
    const members = [];
    
    try {
      // Intentar explorar el objeto para encontrar sus miembros
      const browseResult = await this.session.browse(objectNodeId);
      
      if (browseResult.references) {
        for (const ref of browseResult.references) {
          if (ref.nodeClass === 2) { // Variable
            try {
              const dataValue = await this.session.readVariableValue(ref.nodeId);
              
              members.push({
                nodeId: ref.nodeId.toString(),
                browseName: ref.browseName.toString(),
                displayName: `${parentArrayName}[${arrayIndex}].${ref.browseName.toString()}`,
                nodeClass: 2,
                isVariable: true,
                isArrayElement: true,
                isObjectMember: true,
                arrayIndex: arrayIndex,
                parentArray: parentArrayName,
                memberName: ref.browseName.toString(),
                dataType: this.getDataTypeName(dataValue.dataType),
                value: dataValue.value?.value,
                quality: dataValue.statusCode?.name || 'Unknown',
                accessible: true,
                depth: parentDepth + 2,
                path: `${parentArrayName}[${arrayIndex}].${ref.browseName.toString()}`
              });
            } catch (readError) {
              members.push({
                nodeId: ref.nodeId.toString(),
                browseName: ref.browseName.toString(),
                displayName: `${parentArrayName}[${arrayIndex}].${ref.browseName.toString()}`,
                nodeClass: 2,
                isVariable: true,
                isArrayElement: true,
                isObjectMember: true,
                arrayIndex: arrayIndex,
                parentArray: parentArrayName,
                memberName: ref.browseName.toString(),
                accessible: false,
                error: readError.message,
                depth: parentDepth + 2,
                path: `${parentArrayName}[${arrayIndex}].${ref.browseName.toString()}`
              });
            }
          }
        }
      }
    } catch (error) {
      logger.warn({ err: error, objectNodeId }, 'Failed to browse object members');
    }
    
    return members;
  }

  /**
   * Build a readable path for a node
   */
  buildNodePath(parentNodeId, browseName) {
    if (parentNodeId === 'RootFolder') {
      return browseName;
    }
    
    // Simplificar el path para mostrar solo la parte relevante
    const parts = parentNodeId.split('.');
    const lastPart = parts[parts.length - 1] || parentNodeId;
    return `${lastPart}.${browseName}`;
  }

  /**
   * Get human-readable data type name
   */
  getDataTypeName(dataType) {
    if (!dataType) return 'Unknown';
    
    const typeMap = {
      1: 'Boolean',
      2: 'SByte', 
      3: 'Byte',
      4: 'Int16',
      5: 'UInt16', 
      6: 'Int32',
      7: 'UInt32',
      8: 'Int64',
      9: 'UInt64',
      10: 'Float',
      11: 'Double',
      12: 'String',
      13: 'DateTime',
      15: 'Guid',
      22: 'Structure'
    };

    return typeMap[dataType] || `DataType_${dataType}`;
  }

  /**
   * Add new variables to monitoring dynamically
   */
  async addVariables(newVariables) {
    const added = [];
    const skipped = [];

    for (const variable of newVariables) {
      try {
        // Generar un nombre único para la variable
        const tagName = this.generateTagName(variable.displayName, variable.nodeId);
        
        // Verificar si ya existe
        if (this.tagsConfig.tags[tagName]) {
          skipped.push({ variable, reason: 'Already exists' });
          continue;
        }

        // Crear configuración del tag
        const tagConfig = {
          nodeId: variable.nodeId,
          loggable: true,
          type: this.mapDataType(variable.dataType),
          description: variable.displayName,
          unit: this.inferUnit(variable.displayName),
          accessible: variable.accessible
        };

        // Agregar al mapa de configuración
        this.tagsConfig.tags[tagName] = tagConfig;
        
        // Inicializar el valor del tag
        this.tags.set(tagName, {
          name: tagName,
          value: null,
          quality: 'uncertain',
          timestamp: Date.now(),
          ...tagConfig
        });

        added.push({ tagName, variable, config: tagConfig });
        
        logger.info({ tagName, nodeId: variable.nodeId }, 'Added new variable to monitoring');
      } catch (error) {
        skipped.push({ variable, reason: error.message });
        logger.warn({ err: error, variable }, 'Failed to add variable');
      }
    }

    // Guardar la configuración actualizada
    if (added.length > 0) {
      await this.saveTagsConfiguration();
    }

    return { added, skipped };
  }

  /**
   * Generate a unique tag name from display name and node ID
   */
  generateTagName(displayName, nodeId) {
    // Limpiar el nombre para que sea válido como identificador
    let tagName = displayName
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
    
    // Si el nombre está vacío o es muy corto, usar parte del nodeId
    if (tagName.length < 3) {
      const nodeIdPart = nodeId.split('.').pop() || nodeId.split('=').pop() || 'Variable';
      tagName = nodeIdPart.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    // Asegurar que sea único
    let uniqueName = tagName;
    let counter = 1;
    while (this.tagsConfig.tags[uniqueName]) {
      uniqueName = `${tagName}_${counter}`;
      counter++;
    }

    return uniqueName;
  }

  /**
   * Map OPC UA data type to internal type
   */
  mapDataType(opcuaDataType) {
    if (!opcuaDataType) return 'unknown';
    
    const typeStr = opcuaDataType.toLowerCase();
    if (typeStr.includes('bool')) return 'boolean';
    if (typeStr.includes('int') || typeStr.includes('real') || typeStr.includes('double') || typeStr.includes('float')) return 'number';
    if (typeStr.includes('string')) return 'string';
    return 'unknown';
  }

  /**
   * Infer unit from variable name
   */
  inferUnit(displayName) {
    const name = displayName.toLowerCase();
    if (name.includes('temp')) return '°C';
    if (name.includes('speed') || name.includes('rpm')) return 'RPM';
    if (name.includes('pressure')) return 'bar';
    if (name.includes('count') || name.includes('counter')) return 'units';
    if (name.includes('percent') || name.includes('%')) return '%';
    return '';
  }

  /**
   * Save tags configuration to file
   */
  async saveTagsConfiguration() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const configPath = path.join(process.cwd(), 'tags.json');
      
      await fs.writeFile(configPath, JSON.stringify(this.tagsConfig, null, 2));
      logger.info('Tags configuration saved successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to save tags configuration');
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      mockMode: this.mockMode,
      endpoint: config.opcua.endpoint,
      tagsCount: Object.keys(this.tagsConfig?.tags || {}).length,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Notify WebSocket clients of status change
   */
  notifyStatusChange() {
    // Use setTimeout to avoid circular dependency issues
    setTimeout(() => {
      try {
        // Import wsHandler dynamically
        import('../websocket/wsHandler.js').then(({ default: wsHandler }) => {
          const status = this.getStatus();
          wsHandler.broadcastOpcuaStatus(status);
        }).catch(() => {
          // Ignore import errors
        });
      } catch (error) {
        // Ignore errors if wsHandler is not available yet
        logger.debug({ err: error }, 'Could not notify WebSocket clients of status change');
      }
    }, 100);
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    logger.info('Disconnecting OPC UA client');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
      this.loggingInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close OPC UA session and client
    try {
      if (this.session) {
        await this.session.close();
        this.session = null;
      }
      
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
    } catch (error) {
      logger.warn({ err: error }, 'Error during OPC UA cleanup');
    }

    this.connected = false;

    // Set all tags to bad quality
    tagStore.setAllQuality('bad');

    logger.info('OPC UA client disconnected');
  }
}

// Singleton instance
const opcuaClient = new OpcuaClient();

export default opcuaClient;
