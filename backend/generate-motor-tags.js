import { readFileSync, writeFileSync } from 'fs';

// Configuración de variables basada en el XML classDriveDiagnostic
const variableConfig = {
  lrDCVoltage: { type: 'number', unit: 'V', description: 'DC Bus Voltage', min: 0, max: 800 },
  lrDCVoltage24: { type: 'number', unit: 'V', description: 'DC 24V Voltage', min: 0, max: 30 },
  lrPositionSet: { type: 'number', unit: '°', description: 'Position Setpoint', min: -360, max: 360 },
  lrPositionAct: { type: 'number', unit: '°', description: 'Position Actual', min: -360, max: 360 },
  lrSpeedSet: { type: 'number', unit: 'RPM', description: 'Speed Setpoint', min: 0, max: 3000 },
  lrSpeedAct: { type: 'number', unit: 'RPM', description: 'Speed Actual', min: 0, max: 3000 },
  lrTorqueSet: { type: 'number', unit: 'Nm', description: 'Torque Setpoint', min: 0, max: 150 },
  lrTorqueAct: { type: 'number', unit: 'Nm', description: 'Torque Actual', min: 0, max: 150 },
  lrFollowingError: { type: 'number', unit: '', description: 'Following Error', min: -100, max: 100 },
  lrMotorVoltage: { type: 'number', unit: 'VAC', description: 'Motor Voltage', min: 0, max: 500 },
  lrMotorFreq: { type: 'number', unit: 'Hz', description: 'Motor Frequency', min: 0, max: 100 },
  lrMotorCurrent: { type: 'number', unit: 'A', description: 'Motor Current', min: 0, max: 100 },
  lrMotorAnglePos: { type: 'number', unit: '°', description: 'Motor Angle Position', min: 0, max: 360 },
  lrEffectivePower: { type: 'number', unit: 'kW', description: 'Effective Power', min: 0, max: 50 },
  lrHeatsinkTemp: { type: 'number', unit: '°C', description: 'Heatsink Temperature', min: 0, max: 100 },
  lrMotorTemp: { type: 'number', unit: '°C', description: 'Motor Temperature', min: 0, max: 120 },
  lrInverterLoad: { type: 'number', unit: '%', description: 'Inverter Load', min: 0, max: 100 },
  lrMotorLoad: { type: 'number', unit: '%', description: 'Motor Load', min: 0, max: 100 },
  wAxisError: { type: 'number', unit: '', description: 'Axis Error Code', min: 0, max: 65535 },
  dwDriveError: { type: 'number', unit: '', description: 'Drive Error Code', min: 0, max: 4294967295 },
  dwStatus: { type: 'number', unit: '', description: 'Drive Status', min: 0, max: 4294967295 },
  dwStatusDigital: { type: 'number', unit: '', description: 'Digital Status', min: 0, max: 4294967295 },
  wDriveType: { type: 'number', unit: '', description: 'Drive Type', min: 0, max: 65535 }
};

// Mapeo de nombres OPC a nombres amigables
const friendlyNames = {
  lrDCVoltage: 'dcVoltage',
  lrDCVoltage24: 'dcVoltage24',
  lrPositionSet: 'positionSet',
  lrPositionAct: 'positionAct',
  lrSpeedSet: 'speedSet',
  lrSpeedAct: 'speedAct',
  lrTorqueSet: 'torqueSet',
  lrTorqueAct: 'torqueAct',
  lrFollowingError: 'followingError',
  lrMotorVoltage: 'motorVoltage',
  lrMotorFreq: 'motorFreq',
  lrMotorCurrent: 'motorCurrent',
  lrMotorAnglePos: 'motorAnglePos',
  lrEffectivePower: 'effectivePower',
  lrHeatsinkTemp: 'heatsinkTemp',
  lrMotorTemp: 'motorTemp',
  lrInverterLoad: 'inverterLoad',
  lrMotorLoad: 'motorLoad',
  wAxisError: 'axisError',
  dwDriveError: 'driveError',
  dwStatus: 'status',
  dwStatusDigital: 'statusDigital',
  wDriveType: 'driveType'
};

// Leer configuración actual
const currentConfig = JSON.parse(readFileSync('tags.json', 'utf8'));

// Generar tags para el array aAxisDiagnostic
for (let motorIndex = 1; motorIndex <= 20; motorIndex++) {
  Object.entries(variableConfig).forEach(([opcVar, config]) => {
    const friendlyName = friendlyNames[opcVar];
    const tagName = `aAxisDiagnostic_${motorIndex}_${friendlyName}`;
    const nodeId = `ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[${motorIndex}].${opcVar}`;
    
    currentConfig.tags[tagName] = {
      nodeId: nodeId,
      loggable: false, // No loggear por defecto para evitar demasiados datos
      type: config.type,
      unit: config.unit,
      min: config.min,
      max: config.max,
      description: `Motor ${motorIndex} - ${config.description}`
    };
  });
}

// Escribir configuración actualizada
writeFileSync('tags.json', JSON.stringify(currentConfig, null, 2));

console.log(`Generated ${20 * Object.keys(variableConfig).length} motor diagnostic tags`);
console.log('Tags configuration updated successfully!');