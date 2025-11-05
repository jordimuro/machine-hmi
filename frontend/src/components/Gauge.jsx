import { useMemo } from 'react';

export default function Gauge({ 
  value, 
  min = 0, 
  max = 100, 
  unit = '', 
  label = '', 
  size = 120,
  strokeWidth = 8,
  color = '#eab308',
  backgroundColor = '#e5e7eb',
  showValue = true,
  showPercentage = true,
  showRange = true
}) {
  // Determinar tamaños basado en el prop size
  const getSizes = () => {
    if (size === 'small') {
      return {
        svgSize: 64,
        strokeWidth: 4,
        textSize: 'text-xs',
        valueSize: 'text-sm',
        unitSize: 'text-xs'
      };
    } else if (size === 'medium') {
      return {
        svgSize: 96,
        strokeWidth: 6,
        textSize: 'text-sm',
        valueSize: 'text-lg',
        unitSize: 'text-xs'
      };
    } else if (typeof size === 'number') {
      return {
        svgSize: size,
        strokeWidth: strokeWidth,
        textSize: 'text-sm',
        valueSize: 'text-2xl',
        unitSize: 'text-sm'
      };
    } else {
      return {
        svgSize: 120,
        strokeWidth: 8,
        textSize: 'text-sm',
        valueSize: 'text-2xl',
        unitSize: 'text-sm'
      };
    }
  };

  const sizes = getSizes();
  const normalizedValue = useMemo(() => {
    if (value === null || value === undefined) return 0;
    return Math.max(min, Math.min(max, value));
  }, [value, min, max]);

  const percentage = useMemo(() => {
    return ((normalizedValue - min) / (max - min)) * 100;
  }, [normalizedValue, min, max]);

  const radius = (sizes.svgSize - sizes.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const center = sizes.svgSize / 2;

  // Determinar color basado en el valor
  const getColor = () => {
    if (percentage > 80) return '#ef4444'; // Rojo para valores altos
    if (percentage > 60) return '#f59e0b'; // Amarillo para valores medios-altos
    if (percentage > 40) return '#ca8a04'; // Amarillo oscuro para valores medios
    return '#eab308'; // Amarillo para valores bajos
  };

  const dynamicColor = color === '#eab308' ? getColor() : color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: sizes.svgSize, height: sizes.svgSize }}>
        <svg
          width={sizes.svgSize}
          height={sizes.svgSize}
          className="transform -rotate-90"
        >
          {/* Círculo de fondo */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={sizes.strokeWidth}
            fill="transparent"
          />
          
          {/* Círculo de progreso */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={dynamicColor}
            strokeWidth={sizes.strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Valor en el centro */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${sizes.valueSize} font-bold text-gray-800 dark:text-gray-200`}>
              {value !== null && value !== undefined 
                ? typeof value === 'number' 
                  ? value.toFixed(size === 'small' ? 0 : 1)
                  : value.toString()
                : '--'
              }
            </span>
            {unit && size !== 'small' && (
              <span className={`${sizes.unitSize} text-gray-500 dark:text-gray-400 mt-1`}>{unit}</span>
            )}
          </div>
        )}
        
        {/* Indicador de porcentaje */}
        {showPercentage && size !== 'small' && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {percentage.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Etiqueta */}
      {label && size !== 'small' && (
        <div className="mt-3 text-center">
          <span className={`${sizes.textSize} font-medium text-gray-700 dark:text-gray-300`}>{label}</span>
        </div>
      )}
      
      {/* Rango */}
      {showRange && size !== 'small' && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-center">
          {min} - {max} {unit}
        </div>
      )}
    </div>
  );
}