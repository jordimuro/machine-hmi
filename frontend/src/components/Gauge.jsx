import { useMemo } from 'react';

export default function Gauge({ 
  value, 
  min = 0, 
  max = 100, 
  unit = '', 
  label = '', 
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb'
}) {
  const normalizedValue = useMemo(() => {
    if (value === null || value === undefined) return 0;
    return Math.max(min, Math.min(max, value));
  }, [value, min, max]);

  const percentage = useMemo(() => {
    return ((normalizedValue - min) / (max - min)) * 100;
  }, [normalizedValue, min, max]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const center = size / 2;

  // Determinar color basado en el valor
  const getColor = () => {
    if (percentage > 80) return '#ef4444'; // Rojo para valores altos
    if (percentage > 60) return '#f59e0b'; // Amarillo para valores medios-altos
    if (percentage > 40) return '#10b981'; // Verde para valores medios
    return '#3b82f6'; // Azul para valores bajos
  };

  const dynamicColor = color === '#3b82f6' ? getColor() : color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Círculo de fondo */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Círculo de progreso */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={dynamicColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Valor en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">
            {value !== null && value !== undefined 
              ? typeof value === 'number' 
                ? value.toFixed(1)
                : value.toString()
              : '--'
            }
          </span>
          {unit && (
            <span className="text-sm text-gray-500 mt-1">{unit}</span>
          )}
        </div>
        
        {/* Indicador de porcentaje */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-gray-400">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Etiqueta */}
      {label && (
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      
      {/* Rango */}
      <div className="mt-1 text-xs text-gray-400 text-center">
        {min} - {max} {unit}
      </div>
    </div>
  );
}