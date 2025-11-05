import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

// Función para generar valores aleatorios simulados
const generateRandomValues = () => ({
  // Valores numéricos principales
  dcBusVoltage: (580 + Math.random() * 40).toFixed(1), // 580-620V
  frequencySetpoint: (50 + Math.random() * 10).toFixed(1), // 50-60Hz
  outputFrequencyMotor: (49.5 + Math.random() * 11).toFixed(1), // 49.5-60.5Hz
  internalSetTorque: (Math.random() * 100).toFixed(3), // 0-100Nm
  actualTorque: (Math.random() * 100).toFixed(3), // 0-100Nm
  motorVoltage: (380 + Math.random() * 40).toFixed(0), // 380-420VAC
  motorCurrent: (Math.random() * 50).toFixed(1), // 0-50A
  effectivePower: (Math.random() * 30).toFixed(3), // 0-30kW
  apparentPower: (Math.random() * 35).toFixed(3), // 0-35kVA
  
  // Estados y modos
  qaStatusWord: Math.random() > 0.8 ? 'Voltage error' : 'Ready to switch on',
  deviceState: 'Ready to switch on',
  safetyTorqueOff: Math.random() > 0.9,
  warningActive: Math.random() > 0.8,
  fmf: Math.random() > 0.95,
  
  // Causas de problemas
  causeOfDisable: Math.random() > 0.9 ? 'Safety circuit' : '',
  causeOfQuickStop: Math.random() > 0.95 ? 'Emergency stop' : '',
  causeOfStop: Math.random() > 0.9 ? 'Network' : 'Network',
  
  // Código de error
  errorCode: Math.random() > 0.9 ? 'E001' : 'No Error [0]',
  
  // Modos de operación
  activeOperationMode: 'MS: Velocity mode [3]',
  motorControlMode: 'V/f control (open loop) [6]',
  activeDriveMode: 'Velocity mode [3]',
  activeControlSource: 'Network [1]',
  activeSetpointSource: 'Network: Setpoint [5]',
  
  // Temperatura y utilización
  heatsinkTemperature: (45 + Math.random() * 30).toFixed(0), // 45-75°C
  deviceActualUtilization: Math.floor(Math.random() * 100), // 0-100%
  motorUtilization: Math.floor(Math.random() * 100), // 0-100%
});

const StatusIndicator = ({ active, type = 'default' }) => {
  const getColor = () => {
    if (type === 'warning') return active ? 'bg-warning-500' : 'bg-gray-300';
    if (type === 'danger') return active ? 'bg-danger-500' : 'bg-gray-300';
    if (type === 'success') return active ? 'bg-success-500' : 'bg-gray-300';
    return active ? 'bg-primary-500' : 'bg-gray-300';
  };
  
  return (
    <div className={`w-4 h-4 rounded-full ${getColor()} border-2 border-gray-400`} />
  );
};

const ValueDisplay = ({ label, value, unit, info = false, warning = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
    <div className="flex items-center gap-1">
      {info && <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:min-w-[140px]">
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`px-3 py-1 rounded border ${warning ? 'bg-warning-100 border-warning-300' : 'bg-yellow-100 border-yellow-300'} min-w-[80px] text-center`}>
        <span className="font-mono text-sm">{value}</span>
      </div>
      {unit && <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
    </div>
  </div>
);

const StatusDisplay = ({ label, value, active, type = 'default' }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
    <div className="flex items-center gap-2">
      <StatusIndicator active={active} type={type} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:min-w-[120px]">
        {label}
      </span>
    </div>
    <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300 flex-1">
      <span className="font-mono text-sm">{value}</span>
    </div>
  </div>
);

const ModeDisplay = ({ label, value, info = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
    <div className="flex items-center gap-1">
      {info && <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:min-w-[140px]">
        {label}
      </span>
    </div>
    <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300 flex-1">
      <span className="font-mono text-sm break-all">{value}</span>
    </div>
  </div>
);

const UtilizationChart = ({ title, value, maxValue = 120 }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
    <div className="relative">
      {/* Grid background */}
      <div className="w-full h-32 border border-gray-300 bg-gray-50 dark:bg-gray-700 relative">
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-full border-t border-gray-300" style={{ top: `${i * 25}%` }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute h-full border-l border-gray-300" style={{ left: `${i * 25}%` }} />
        ))}
        
        {/* Value bar */}
        <div 
          className="absolute bottom-0 left-0 bg-primary-500 opacity-70"
          style={{ 
            width: '20px', 
            height: `${(value / maxValue) * 100}%`,
            marginLeft: '10px'
          }}
        />
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute -left-8 top-0 h-32 flex flex-col justify-between text-xs text-gray-600">
        <span>{maxValue}</span>
        <span>{maxValue * 0.75}</span>
        <span>{maxValue * 0.5}</span>
        <span>{maxValue * 0.25}</span>
        <span>0</span>
      </div>
    </div>
    
    {/* Value display */}
    <div className="flex items-center gap-2 mt-2">
      <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>
      <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300">
        <span className="font-mono text-sm">{value}</span>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
    </div>
  </div>
);

export default function MotorDiagnostics() {
  const { t } = useTranslation();
  const [selectedMotor, setSelectedMotor] = useState(1);
  const [data, setData] = useState(generateRandomValues());
  const { data: wsData } = useWebSocket();
  const tags = wsData.tags || {};

  // Generar opciones de motores (1-20)
  const motorOptions = Array.from({ length: 20 }, (_, i) => ({
    value: i + 1,
    label: `Motor ${i + 1}`
  }));

  // Obtener datos reales del motor seleccionado desde OPC-UA
  const getMotorData = (motorIndex) => {
    const motorData = {};
    
    // Mapear variables OPC-UA a datos de diagnóstico
    const tagPrefix = `aAxisDiagnostic_${motorIndex}_`;
    
    motorData.dcVoltage = tags[`${tagPrefix}dcVoltage`]?.value || 0;
    motorData.speedSet = tags[`${tagPrefix}speedSet`]?.value || 0;
    motorData.speedAct = tags[`${tagPrefix}speedAct`]?.value || 0;
    motorData.torqueSet = tags[`${tagPrefix}torqueSet`]?.value || 0;
    motorData.torqueAct = tags[`${tagPrefix}torqueAct`]?.value || 0;
    motorData.motorVoltage = tags[`${tagPrefix}motorVoltage`]?.value || 0;
    motorData.motorCurrent = tags[`${tagPrefix}motorCurrent`]?.value || 0;
    motorData.effectivePower = tags[`${tagPrefix}effectivePower`]?.value || 0;
    motorData.heatsinkTemp = tags[`${tagPrefix}heatsinkTemp`]?.value || 0;
    motorData.motorTemp = tags[`${tagPrefix}motorTemp`]?.value || 0;
    motorData.motorLoad = tags[`${tagPrefix}motorLoad`]?.value || 0;
    motorData.inverterLoad = tags[`${tagPrefix}inverterLoad`]?.value || 0;
    motorData.axisError = tags[`${tagPrefix}axisError`]?.value || 0;
    motorData.driveError = tags[`${tagPrefix}driveError`]?.value || 0;
    motorData.status = tags[`${tagPrefix}status`]?.value || 0;
    
    return motorData;
  };

  const motorData = getMotorData(selectedMotor);
  const isRunning = motorData.speedAct > 10;
  const hasErrors = motorData.axisError > 0 || motorData.driveError > 0;

  // Actualizar datos simulados cada 2 segundos (para valores que no vienen del OPC)
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateRandomValues());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('motorDiagnostics.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('motorDiagnostics.subtitle')}
              </p>
            </div>
          </div>
          
          {/* Motor Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccionar Motor:
            </label>
            <div className="relative">
              <select
                value={selectedMotor}
                onChange={(e) => setSelectedMotor(parseInt(e.target.value))}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {motorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            
            {/* Motor Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <div className={`w-3 h-3 rounded-full ${
                hasErrors ? 'bg-red-500' : 
                isRunning ? 'bg-green-500 animate-pulse' : 
                'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {hasErrors ? 'ERROR' : isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column - Basic Values */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Parameters
            </h3>
            
            <ValueDisplay label="DC bus voltage" value={motorData.dcVoltage?.toFixed(1) || '0.0'} unit="V" info />
            <ValueDisplay label="Speed setpoint" value={motorData.speedSet?.toFixed(1) || '0.0'} unit="RPM" info />
            <ValueDisplay label="Actual speed" value={motorData.speedAct?.toFixed(1) || '0.0'} unit="RPM" info />
            <ValueDisplay label="Torque setpoint" value={motorData.torqueSet?.toFixed(2) || '0.00'} unit="Nm" info />
            <ValueDisplay label="Actual torque" value={motorData.torqueAct?.toFixed(2) || '0.00'} unit="Nm" info />
            <ValueDisplay label="Motor voltage" value={motorData.motorVoltage?.toFixed(0) || '0'} unit="VAC" info />
            <ValueDisplay label="Motor current" value={motorData.motorCurrent?.toFixed(1) || '0.0'} unit="A" info />
            <ValueDisplay label="Effective power" value={motorData.effectivePower?.toFixed(2) || '0.00'} unit="kW" info />
            <ValueDisplay label="Motor load" value={motorData.motorLoad?.toFixed(1) || '0.0'} unit="%" info />
          </div>

          {/* Middle Column - Status and Modes */}
          <div className="space-y-6">
            
            {/* Status Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Status Information
              </h3>
              
              <StatusDisplay 
                label="Motor Status" 
                value={hasErrors ? 'Error State' : isRunning ? 'Running' : 'Stopped'}
                active={isRunning}
                type={hasErrors ? 'danger' : isRunning ? 'success' : 'default'}
              />
              <StatusDisplay 
                label="Axis Error" 
                value={motorData.axisError > 0 ? `Error Code: ${motorData.axisError}` : 'No Error'}
                active={motorData.axisError > 0}
                type={motorData.axisError > 0 ? 'danger' : 'success'}
              />
              <StatusDisplay 
                label="Drive Error" 
                value={motorData.driveError > 0 ? `Error Code: ${motorData.driveError}` : 'No Error'}
                active={motorData.driveError > 0}
                type={motorData.driveError > 0 ? 'danger' : 'success'}
              />
              <StatusDisplay 
                label="System Status" 
                value={`Status: ${motorData.status || 0}`}
                active={true}
                type="default"
              />
            </div>

            {/* Causes Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Diagnostic Information
              </h3>
              
              <ValueDisplay label="Inverter Load" value={`${motorData.inverterLoad?.toFixed(1) || '0.0'}%`} info />
              <ValueDisplay label="Motor Temperature" value={`${motorData.motorTemp?.toFixed(1) || '0.0'}°C`} info />
              <ValueDisplay label="Heatsink Temperature" value={`${motorData.heatsinkTemp?.toFixed(1) || '0.0'}°C`} info />
              <ValueDisplay 
                label="Error Status" 
                value={hasErrors ? `Axis: ${motorData.axisError}, Drive: ${motorData.driveError}` : 'No Errors'} 
                info 
                warning={hasErrors} 
              />
            </div>

            {/* Operation Modes */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Operation Modes
              </h3>
              
              <ModeDisplay label="Active operation mode" value={data.activeOperationMode} info />
              <ModeDisplay label="Motor control mode" value={data.motorControlMode} info />
              <ModeDisplay label="Active drive mode" value={data.activeDriveMode} info />
              <ModeDisplay label="Active control source" value={data.activeControlSource} info />
              <ModeDisplay label="Active setpoint source" value={data.activeSetpointSource} info />
            </div>
          </div>

          {/* Right Column - Charts and Temperature */}
          <div className="space-y-6">
            
            {/* Temperature */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Temperature
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Heatsink temperature
                </span>
                <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300">
                  <span className="font-mono text-sm">{motorData.heatsinkTemp?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">°C</span>
              </div>
            </div>

            {/* Utilization Charts */}
            <UtilizationChart 
              title="Inverter Load (%)" 
              value={motorData.inverterLoad || 0} 
            />
            
            <UtilizationChart 
              title="Motor Load (%)" 
              value={motorData.motorLoad || 0} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}