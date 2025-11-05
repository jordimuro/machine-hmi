import opcua from 'node-opcua';
import config from './src/config/index.js';

// Script para probar específicamente el array aAxisDiagnostic

async function testMotorArray() {
  console.log('=== PRUEBA DE CONECTIVIDAD ARRAY MOTORES ===\n');
  
  let client, session;
  
  try {
    // Crear cliente OPC-UA
    client = opcua.OPCUAClient.create({
      applicationName: "Motor Array Test Client",
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3
      },
      securityMode: opcua.MessageSecurityMode.None,
      securityPolicy: opcua.SecurityPolicy.None,
      endpoint_must_exist: false
    });

    console.log(`Conectando a: ${config.opcua.endpoint}`);
    await client.connect(config.opcua.endpoint);
    console.log('✅ Conectado al servidor OPC-UA\n');

    // Crear sesión
    session = await client.createSession();
    console.log('✅ Sesión OPC-UA creada\n');

    // Probar tags básicos primero
    console.log('=== PROBANDO TAGS BÁSICOS ===');
    const basicTags = [
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.lrActualSpeed',
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.RandomValues[1]'
    ];

    for (const nodeId of basicTags) {
      try {
        const dataValue = await session.readVariableValue(nodeId);
        console.log(`✅ ${nodeId}: ${dataValue.value.value} (${dataValue.statusCode.name})`);
      } catch (error) {
        console.log(`❌ ${nodeId}: ${error.message}`);
      }
    }

    // Probar algunos tags del array de motores
    console.log('\n=== PROBANDO ARRAY DE MOTORES ===');
    const motorTags = [
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[1].lrDCVoltage',
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[1].lrSpeedAct',
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[2].lrDCVoltage',
      'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[20].lrDCVoltage'
    ];

    for (const nodeId of motorTags) {
      try {
        const dataValue = await session.readVariableValue(nodeId);
        console.log(`✅ ${nodeId}: ${dataValue.value.value} (${dataValue.statusCode.name})`);
      } catch (error) {
        console.log(`❌ ${nodeId}: ${error.message}`);
      }
    }

    // Probar lectura en lote
    console.log('\n=== PROBANDO LECTURA EN LOTE ===');
    const batchNodes = motorTags.slice(0, 2).map(nodeId => ({
      nodeId: nodeId,
      attributeId: 13
    }));

    try {
      const dataValues = await session.read(batchNodes);
      dataValues.forEach((dataValue, index) => {
        const nodeId = motorTags[index];
        if (dataValue.statusCode.isGood()) {
          console.log(`✅ Lote ${index + 1}: ${dataValue.value.value}`);
        } else {
          console.log(`❌ Lote ${index + 1}: ${dataValue.statusCode.name}`);
        }
      });
    } catch (error) {
      console.log(`❌ Error en lectura de lote: ${error.message}`);
    }

  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
  } finally {
    // Limpiar
    if (session) {
      await session.close();
      console.log('\n✅ Sesión cerrada');
    }
    if (client) {
      await client.disconnect();
      console.log('✅ Cliente desconectado');
    }
  }
}

// Ejecutar prueba
testMotorArray().catch(console.error);