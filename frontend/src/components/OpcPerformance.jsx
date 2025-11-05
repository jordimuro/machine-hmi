import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, Thermometer, Gauge as GaugeIcon } from 'lucide-react';
import Gauge from './Gauge';

// Generar datos simulados para 20 motores con 23 variables cada uno
const generateMotorData = (motorIndex) => {
  const baseValues = {
    // Variables de velocidad y frecuencia
    actualSpeed: 1400 + Math.random() * 200,
    setpointSpeed: 1500 + Math.random() * 100,
    outputFrequency: 49 + Math.random() * 12,
    frequencySetpoint: 50 + Math.random() * 10,
    
    // Variables eléctricas
    dcBusVoltage: 580 + Math.random() * 40,
    motorVoltage: 380 + Math.random() * 40,
    motorCurrent: Math.random() * 50,
    effectivePower: Math.random() * 30,
    apparentPower: Math.random() * 35,
    powerFactor: 0.7 + Math.random() * 0.3,
    
    // Variables de torque
    actualTorque: Math.random() * 100,
    setpointTorque: Math.random() * 100,
    internalSetTorque: Math.random() * 100,
    
    // Variables de temperatura
    motorTemperature: 40 + Math.random() * 60,
    heatsinkTemperature: 45 + Math.random() * 30,
    ambientTemperature: 20 + Math.random() * 15,
    
    // Variables de estado y utilización
    deviceUtilization: Math.random() * 100,
    motorUtilization: Math.random() * 100,
    efficiency: 80 + Math.random() * 15,
    
    // Variables de vibración y mantenimiento
    vibrationLevel: Math.random() * 10,
    operatingHours: 1000 + Math.random() * 5000,
    maintenanceCounter: Math.floor(Math.random() * 100),
    
    // Variable de estado general
    overallStatus: 85 + Math.random() * 15
  };
  
  // Añadir variación específica por motor
  const motorVariation = (motorIndex + 1) * 0.1;
  Object.keys(baseValues).forEach(key => {
    if (typeof baseValues[key] === 'number') {
      baseValues[key] *= (1 + (Math.sin(motorIndex) * motorVariation));
    }
  });
  
  return baseValues;
};

// Configuración de las variables con sus rangos y unidades
const variableConfig = {
  actualSpeed: { min: 0, max: 2000, unit: 'RPM', color: '#84cc16', label: 'Actual Speed' },
  setpointSpeed: { min: 0, max: 2000, unit: 'RPM', color: '#65a30d', label: 'Setpoint Speed' },
  outputFrequency: { min: 0, max: 100, unit: 'Hz', color: '#3b82f6', label: 'Output Freq' },
  frequencySetpoint: { min: 0, max: 100, unit: 'Hz', color: '#1d4ed8', label: 'Freq Setpoint' },
  
  dcBusVoltage: { min: 0, max: 800, unit: 'V', color: '#f59e0b', label: 'DC Bus Voltage' },
  motorVoltage: { min: 0, max: 500, unit: 'VAC', color: '#d97706', label: 'Motor Voltage' },
  motorCurrent: { min: 0, max: 100, unit: 'A', color: '#dc2626', label: 'Motor Current' },
  effectivePower: { min: 0, max: 50, unit: 'kW', color: '#7c3aed', label: 'Effective Power' },
  apparentPower: { min: 0, max: 60, unit: 'kVA', color: '#5b21b6', label: 'Apparent Power' },
  powerFactor: { min: 0, max: 1, unit: '', color: '#059669', label: 'Power Factor' },
  
  actualTorque: { min: 0, max: 150, unit: 'Nm', color: '#0891b2', label: 'Actual Torque' },
  setpointTorque: { min: 0, max: 150, unit: 'Nm', color: '#0e7490', label: 'Setpoint Torque' },
  internalSetTorque: { min: 0, max: 150, unit: 'Nm', color: '#155e75', label: 'Internal Torque' },
  
  motorTemperature: { min: 0, max: 120, unit: '°C', color: '#ef4444', label: 'Motor Temp' },
  heatsinkTemperature: { min: 0, max: 100, unit: '°C', color: '#f97316', label: 'Heatsink Temp' },
  ambientTemperature: { min: 0, max: 50, unit: '°C', color: '#06b6d4', label: 'Ambient Temp' },
  
  deviceUtilization: { min: 0, max: 100, unit: '%', color: '#8b5cf6', label: 'Device Util' },
  motorUtilization: { min: 0, max: 100, unit: '%', color: '#a855f7', label: 'Motor Util' },
  efficiency: { min: 0, max: 100, unit: '%', color: '#22c55e', label: 'Efficiency' },
  
  vibrationLevel: { min: 0, max: 20, unit: 'mm/s', color: '#f43f5e', label: 'Vibration' },
  operatingHours: { min: 0, max: 10000, unit: 'h', color: '#64748b', label: 'Op Hours' },
  maintenanceCounter: { min: 0, max: 200, unit: '', color: '#6b7280', label: 'Maintenance' },
  
  overallStatus: { min: 0, max: 100, unit: '%', color: '#10b981', label: 'Overall Status' }
};

const MotorPanel = ({ motorIndex, motorData }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-2 mb-4">
        <GaugeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Motor {motorIndex + 1}
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          motorData.overallStatus > 90 ? 'bg-green-100 text-green-800' :
          motorData.overallStatus > 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {motorData.overallStatus.toFixed(1)}% OK
        </div>
      </div>
      
      {/* Grid de gauges pequeños */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {Object.entries(variableConfig).map(([key, config]) => (
          <div key={key} className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20">
              <Gauge
                value={motorData[key] || 0}
                min={config.min}
                max={config.max}
                unit={config.unit}
                color={config.color}
                size="small"
                showValue={false}
              />
            </div>
            <div className="text-center mt-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-16 sm:w-20">
                {config.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {typeof motorData[key] === 'number' ? motorData[key].toFixed(1) : '0.0'}
                {config.unit && ` ${config.unit}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function OpcPerformance() {
  const { t } = useTranslation();
  const [motorsData, setMotorsData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Generar datos iniciales
  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, index) => 
      generateMotorData(index)
    );
    setMotorsData(initialData);
  }, []);

  // Actualizar datos cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setMotorsData(prevData => 
        prevData.map((_, index) => generateMotorData(index))
      );
      setLastUpdate(Date.now());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calcular estadísticas generales
  const totalMotors = motorsData.length;
  const activeMotors = motorsData.filter(motor => motor.actualSpeed > 100).length;
  const avgEfficiency = motorsData.length > 0 
    ? motorsData.reduce((sum, motor) => sum + motor.efficiency, 0) / motorsData.length 
    : 0;
  const avgTemperature = motorsData.length > 0
    ? motorsData.reduce((sum, motor) => sum + motor.motorTemperature, 0) / motorsData.length
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
              <Activity className="w-5 h-5 text-primary-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {avgEfficiency.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Efficiency</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {avgTemperature.toFixed(1)}°C
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Temperature</div>
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