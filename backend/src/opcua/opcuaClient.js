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

      // For now, we'll use mock mode by default for development
      // In production, implement real OPC UA connection here
      logger.info('Using mock OPC UA mode for development');
      this.enableMockMode();

    } catch (error) {
      logger.warn({ err: error }, 'node-opcua not available or connection failed, using mock mode');
      this.enableMockMode();
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
        this.mockData[tagName] = min + (max - min) * 0.5; // Start at middle
      } else {
        this.mockData[tagName] = '';
      }

      // Initialize tag store
      tagStore.update(tagName, this.mockData[tagName], 'good');
    });

    logger.info('Mock OPC UA mode enabled with simulated data');

    // Start polling and logging
    this.startPolling();
    this.startLogging();
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
      // Implement real OPC UA polling here
      // this.pollTagsReal();
    }
  }

  /**
   * Poll tags in mock mode with simulated realistic data
   */
  pollTagsMock() {
    Object.entries(this.tagsConfig.tags).forEach(([tagName, tagConfig]) => {
      let newValue = this.mockData[tagName];

      if (tagConfig.type === 'boolean') {
        // Randomly flip booleans occasionally
        if (Math.random() < 0.02) { // 2% chance per poll
          newValue = !newValue;
          this.mockData[tagName] = newValue;
        }
      } else if (tagConfig.type === 'number') {
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
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      mockMode: this.mockMode,
      endpoint: config.opcua.endpoint,
      tagsCount: Object.keys(this.tagsConfig?.tags || {}).length,
    };
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

    this.connected = false;

    // Set all tags to bad quality
    tagStore.setAllQuality('bad');

    logger.info('OPC UA client disconnected');
  }
}

// Singleton instance
const opcuaClient = new OpcuaClient();

export default opcuaClient;
