import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  <div className="flex items-center gap-2 mb-2">
    <div className="flex items-center gap-1">
      {info && <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
        {label}
      </span>
    </div>
    <div className={`px-3 py-1 rounded border ${warning ? 'bg-warning-100 border-warning-300' : 'bg-yellow-100 border-yellow-300'} min-w-[80px] text-center`}>
      <span className="font-mono text-sm">{value}</span>
    </div>
    {unit && <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
  </div>
);

const StatusDisplay = ({ label, value, active, type = 'default' }) => (
  <div className="flex items-center gap-2 mb-2">
    <StatusIndicator active={active} type={type} />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
      {label}
    </span>
    <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300 flex-1">
      <span className="font-mono text-sm">{value}</span>
    </div>
  </div>
);

const ModeDisplay = ({ label, value, info = false }) => (
  <div className="flex items-center gap-2 mb-2">
    {info && <div className="w-4 h-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded">i</div>}
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
      {label}
    </span>
    <div className="px-3 py-1 rounded border bg-yellow-100 border-yellow-300 flex-1">
      <span className="font-mono text-sm">{value}</span>
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
  const [data, setData] = useState(generateRandomValues());

  // Actualizar datos cada 2 segundos
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
        <div className="flex items-center gap-3 mb-6">
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Basic Values */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Parameters
            </h3>
            
            <ValueDisplay label="DC bus voltage" value={data.dcBusVoltage} unit="V" info />
            <ValueDisplay label="Frequency setpoint" value={data.frequencySetpoint} unit="Hz" info />
            <ValueDisplay label="Output frequency motor" value={data.outputFrequencyMotor} unit="Hz" info />
            <ValueDisplay label="Internal set torque" value={data.internalSetTorque} unit="Nm" info />
            <ValueDisplay label="Actual torque" value={data.actualTorque} unit="Nm" info />
            <ValueDisplay label="Motor voltage" value={data.motorVoltage} unit="VAC" info />
            <ValueDisplay label="Motor current" value={data.motorCurrent} unit="A" info />
            <ValueDisplay label="Effective power" value={data.effectivePower} unit="kW" info />
            <ValueDisplay label="Apparent power" value={data.apparentPower} unit="kVA" info />
          </div>

          {/* Middle Column - Status and Modes */}
          <div className="space-y-6">
            
            {/* Status Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Status Information
              </h3>
              
              <StatusDisplay 
                label="QA status word" 
                value={data.qaStatusWord}
                active={data.qaStatusWord !== 'Ready to switch on'}
                type={data.qaStatusWord !== 'Ready to switch on' ? 'warning' : 'success'}
              />
              <StatusDisplay 
                label="Device state" 
                value={data.deviceState}
                active={true}
                type="success"
              />
              <StatusDisplay 
                label="Safe torque off" 
                value=""
                active={data.safetyTorqueOff}
                type="danger"
              />
              <StatusDisplay 
                label="Warning active" 
                value=""
                active={data.warningActive}
                type="warning"
              />
              <StatusDisplay 
                label="FMF" 
                value=""
                active={data.fmf}
                type="danger"
              />
            </div>

            {/* Causes Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Diagnostic Information
              </h3>
              
              <ValueDisplay label="Cause of disable" value={data.causeOfDisable || '-'} info />
              <ValueDisplay label="Cause of quick stop" value={data.causeOfQuickStop || '-'} info />
              <ValueDisplay label="Cause of stop" value={data.causeOfStop} info />
              <ValueDisplay label="Error code" value={data.errorCode} info warning={data.errorCode !== 'No Error [0]'} />
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
                  <span className="font-mono text-sm">{data.heatsinkTemperature}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">°C</span>
              </div>
            </div>

            {/* Utilization Charts */}
            <UtilizationChart 
              title="Device actual utilization" 
              value={data.deviceActualUtilization} 
            />
            
            <UtilizationChart 
              title="Motor utilization (%)" 
              value={data.motorUtilization} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}