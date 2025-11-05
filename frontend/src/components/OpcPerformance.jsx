import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, Thermometer, Gauge as GaugeIcon } from 'lucide-react';
import Gauge from './Gauge';
import { useWebSocket } from '../hooks/useWebSocket';

// Mapeo de variables del XML a nombres amigables
const variableMapping = {
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

// Generar nombres de tags OPC-UA para el array aAxisDiagnostic
const generateOpcTags = () => {
  const tags = {};
  
  // Para cada motor (1 a 20)
  for (let motorIndex = 1; motorIndex <= 20; motorIndex++) {
    // Para cada variable en classDriveDiagnostic
    Object.keys(variableMapping).forEach(opcVar => {
      const friendlyName = variableMapping[opcVar];
      const tagName = `aAxisDiagnostic_${motorIndex}_${friendlyName}`;
      const nodeId = `ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.aAxisDiagnostic[${motorIndex}].${opcVar}`;
      
      tags[tagName] = {
        nodeId,
        motorIndex,
        variable: friendlyName,
        opcVariable: opcVar
      };
    });
  }
  
  return tags;
};

const opcTags = generateOpcTags();

// Configuración de las variables basada en el XML classDriveDiagnostic
const variableConfig = {
  dcVoltage: { min: 0, max: 800, unit: 'V', color: '#f59e0b', label: 'DC Voltage' },
  dcVoltage24: { min: 0, max: 30, unit: 'V', color: '#d97706', label: 'DC 24V' },
  positionSet: { min: -360, max: 360, unit: '°', color: '#3b82f6', label: 'Pos Set' },
  positionAct: { min: -360, max: 360, unit: '°', color: '#1d4ed8', label: 'Pos Act' },
  speedSet: { min: 0, max: 3000, unit: 'RPM', color: '#84cc16', label: 'Speed Set' },
  speedAct: { min: 0, max: 3000, unit: 'RPM', color: '#65a30d', label: 'Speed Act' },
  torqueSet: { min: 0, max: 150, unit: 'Nm', color: '#0891b2', label: 'Torque Set' },
  torqueAct: { min: 0, max: 150, unit: 'Nm', color: '#0e7490', label: 'Torque Act' },
  followingError: { min: -100, max: 100, unit: '', color: '#f43f5e', label: 'Follow Err' },
  motorVoltage: { min: 0, max: 500, unit: 'VAC', color: '#7c3aed', label: 'Motor V' },
  motorFreq: { min: 0, max: 100, unit: 'Hz', color: '#5b21b6', label: 'Motor Freq' },
  motorCurrent: { min: 0, max: 100, unit: 'A', color: '#dc2626', label: 'Motor I' },
  motorAnglePos: { min: 0, max: 360, unit: '°', color: '#059669', label: 'Angle Pos' },
  effectivePower: { min: 0, max: 50, unit: 'kW', color: '#155e75', label: 'Eff Power' },
  heatsinkTemp: { min: 0, max: 100, unit: '°C', color: '#ef4444', label: 'Heatsink T' },
  motorTemp: { min: 0, max: 120, unit: '°C', color: '#f97316', label: 'Motor T' },
  inverterLoad: { min: 0, max: 100, unit: '%', color: '#8b5cf6', label: 'Inv Load' },
  motorLoad: { min: 0, max: 100, unit: '%', color: '#a855f7', label: 'Motor Load' },
  axisError: { min: 0, max: 65535, unit: '', color: '#ef4444', label: 'Axis Err' },
  driveError: { min: 0, max: 4294967295, unit: '', color: '#dc2626', label: 'Drive Err' },
  status: { min: 0, max: 4294967295, unit: '', color: '#22c55e', label: 'Status' },
  statusDigital: { min: 0, max: 4294967295, unit: '', color: '#10b981', label: 'Status Dig' },
  driveType: { min: 0, max: 65535, unit: '', color: '#64748b', label: 'Drive Type' }
};

const MotorPanel = ({ motorIndex, motorData, tags }) => {
  // Calcular estado general del motor basado en errores
  const hasErrors = (motorData.axisError || 0) > 0 || (motorData.driveError || 0) > 0;
  const isRunning = (motorData.speedAct || 0) > 10;
  const overallStatus = hasErrors ? 'error' : isRunning ? 'running' : 'stopped';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-2 mb-4">
        <GaugeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Motor {motorIndex + 1}
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          overallStatus === 'error' ? 'bg-red-100 text-red-800' :
          overallStatus === 'running' ? 'bg-green-100 text-green-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {overallStatus === 'error' ? 'ERROR' :
           overallStatus === 'running' ? 'RUNNING' : 'STOPPED'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {(motorData.speedAct || 0).toFixed(0)} RPM
        </div>
      </div>
      
      {/* Grid de gauges pequeños */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {Object.entries(variableConfig).map(([key, config]) => {
          const value = motorData[key];
          const quality = tags[`aAxisDiagnostic_${motorIndex + 1}_${key}`]?.quality || 'uncertain';
          
          return (
            <div key={key} className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20">
                <Gauge
                  value={value || 0}
                  min={config.min}
                  max={config.max}
                  unit={config.unit}
                  color={quality === 'good' ? config.color : '#9ca3af'}
                  size="small"
                  showValue={false}
                />
              </div>
              <div className="text-center mt-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-16 sm:w-20">
                  {config.label}
                </div>
                <div className={`text-xs ${quality === 'good' ? 'text-gray-500 dark:text-gray-400' : 'text-red-500'}`}>
                  {value !== null && value !== undefined ? 
                    (typeof value === 'number' ? value.toFixed(1) : value.toString()) : 
                    '--'
                  }
                  {config.unit && value !== null && value !== undefined && ` ${config.unit}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OpcPerformance() {
  const { t } = useTranslation();
  const [motorsData, setMotorsData] = useState(Array(20).fill({}));
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { tags, connected } = useWebSocket();

  // Actualizar datos de motores cuando cambien los tags
  useEffect(() => {
    if (!tags || Object.keys(tags).length === 0) return;

    const newMotorsData = Array(20).fill(null).map((_, motorIndex) => {
      const motorData = {};
      
      // Para cada variable, buscar el tag correspondiente
      Object.keys(variableConfig).forEach(variable => {
        const tagName = `aAxisDiagnostic_${motorIndex + 1}_${variable}`;
        const tag = tags[tagName];
        
        if (tag) {
          motorData[variable] = tag.value;
        }
      });
      
      return motorData;
    });

    setMotorsData(newMotorsData);
    setLastUpdate(Date.now());
  }, [tags]);

  // Calcular estadísticas generales
  const totalMotors = motorsData.length;
  const activeMotors = motorsData.filter(motor => (motor.speedAct || 0) > 10).length;
  const motorsWithErrors = motorsData.filter(motor => 
    (motor.axisError || 0) > 0 || (motor.driveError || 0) > 0
  ).length;
  const avgMotorLoad = motorsData.length > 0 
    ? motorsData.reduce((sum, motor) => sum + (motor.motorLoad || 0), 0) / motorsData.length 
    : 0;
  const avgTemperature = motorsData.length > 0
    ? motorsData.reduce((sum, motor) => sum + (motor.motorTemp || 0), 0) / motorsData.length
    : 0;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('opcPerformance.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('opcPerformance.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last Update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-4">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connected ? '🟢 Connected to OPC-UA Server' : '🔴 Disconnected from OPC-UA Server'}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <GaugeIcon className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalMotors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Motors</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeMotors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Motors</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {motorsWithErrors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Motors w/ Errors</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {avgTemperature.toFixed(1)}°C
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Motor Temp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Motors Grid */}
        <div className="space-y-6">
          {motorsData.map((motorData, index) => (
            <MotorPanel
              key={index}
              motorIndex={index}
              motorData={motorData}
              tags={tags}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Showing {Object.keys(variableConfig).length} variables per motor × {totalMotors} motors = {Object.keys(variableConfig).length * totalMotors} total data points</p>
          <p>Data updates every 2 seconds</p>
        </div>
      </div>
    </div>
  );
}