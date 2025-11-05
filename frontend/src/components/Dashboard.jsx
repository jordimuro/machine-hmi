import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTags } from '../hooks/useWebSocket';
import apiClient from '../services/apiClient';
import { Activity, Gauge as GaugeIcon, Thermometer, Zap, Package, AlertTriangle } from 'lucide-react';
import Gauge from './Gauge';

const TAG_ICONS = {
  MachineSpeed: GaugeIcon,
  TemperatureZone1: Thermometer,
  TemperatureZone2: Thermometer,
  Pressure: Zap,
  ProductionCount: Package,
  MachineRunning: Activity,
  ActualSpeed: GaugeIcon,
  RandomValue_01: Activity,
  RandomValue_02: Activity,
  RandomValue_03: Activity,
  RandomValue_04: Activity,
  RandomValue_05: Activity,
};

// Configuración de rangos para los gauges
const GAUGE_CONFIGS = {
  ActualSpeed: { min: -5000, max: 5000, unit: 'RPM', color: '#3b82f6' },
  RandomValue_01: { min: -3000, max: 3000, unit: '', color: '#10b981' },
  RandomValue_02: { min: -3000, max: 3000, unit: '', color: '#f59e0b' },
  RandomValue_03: { min: -3000, max: 3000, unit: '', color: '#ef4444' },
  RandomValue_04: { min: -3000, max: 3000, unit: '', color: '#8b5cf6' },
  RandomValue_05: { min: -3000, max: 3000, unit: '', color: '#06b6d4' },
  MachineSpeed: { min: 0, max: 3000, unit: 'RPM', color: '#3b82f6' },
  TemperatureZone1: { min: 0, max: 300, unit: '°C', color: '#ef4444' },
  TemperatureZone2: { min: 0, max: 300, unit: '°C', color: '#ef4444' },
  Pressure: { min: 0, max: 10, unit: 'bar', color: '#f59e0b' },
  ProductionCount: { min: 0, max: 1000, unit: 'units', color: '#10b981' },
};

function GaugeCard({ tag, t }) {
  if (!tag) return null;

  const config = GAUGE_CONFIGS[tag.name] || { min: 0, max: 100, unit: '', color: '#3b82f6' };
  
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'good':
        return 'status-good';
      case 'bad':
        return 'status-bad';
      case 'uncertain':
        return 'status-uncertain';
      default:
        return 'bg-gray-400';
    }
  };

  // Get translated tag name
  const getTagLabel = (name) => {
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    return t(`tags.${key}`, name);
  };

  return (
    <div className="card relative">
      {/* Quality Indicator */}
      <div className="absolute top-4 right-4">
        <span
          className={`status-dot ${getQualityColor(tag.quality)}`}
          title={t(`quality.${tag.quality}`)}
        />
      </div>

      {/* Gauge */}
      <div className="flex justify-center mb-4">
        <Gauge
          value={tag.value}
          min={config.min}
          max={config.max}
          unit={config.unit}
          label={getTagLabel(tag.name)}
          color={config.color}
          size={140}
        />
      </div>

      {/* Timestamp */}
      <div className="text-center text-xs text-gray-500">
        {new Date(tag.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function TagCard({ tag, t }) {
  if (!tag) return null;

  const Icon = TAG_ICONS[tag.name] || Activity;

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'good':
        return 'status-good';
      case 'bad':
        return 'status-bad';
      case 'uncertain':
        return 'status-uncertain';
      default:
        return 'bg-gray-400';
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? t('tags.on') : t('tags.off');
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  const getValueColor = (name, value) => {
    if (typeof value === 'boolean') {
      return value ? 'text-success-600' : 'text-gray-600';
    }
    if (name.includes('Temperature') && value > 250) {
      return 'text-danger-600';
    }
    if (name === 'Pressure' && value > 8) {
      return 'text-danger-600';
    }
    return 'text-gray-800';
  };

  // Get translated tag name
  const getTagLabel = (name) => {
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    return t(`tags.${key}`, name);
  };

  return (
    <div className="card relative">
      {/* Quality Indicator */}
      <div className="absolute top-4 right-4">
        <span
          className={`status-dot ${getQualityColor(tag.quality)}`}
          title={t(`quality.${tag.quality}`)}
        />
      </div>

      {/* Icon */}
      <div className="mb-4">
        <Icon className="w-8 h-8 text-primary-600" />
      </div>

      {/* Tag Name */}
      <div className="tag-label mb-2">{getTagLabel(tag.name)}</div>

      {/* Value */}
      <div className={`tag-value ${getValueColor(tag.name, tag.value)}`}>
        {formatValue(tag.value)}
      </div>

      {/* Timestamp */}
      <div className="mt-2 text-xs text-gray-500">
        {new Date(tag.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [initialTags, setInitialTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const tags = useTags(initialTags);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await apiClient.getTags();
      setInitialTags(response.tags);
    } catch (error) {
      console.error('Failed to load tags', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-16 h-16" />
      </div>
    );
  }

  const tagArray = Array.from(tags.values());
  
  // Orden preferido para mostrar las variables
  const processTagsOrder = [
    'ActualSpeed',
    'RandomValue_01',
    'RandomValue_02', 
    'RandomValue_03',
    'RandomValue_04',
    'RandomValue_05',
    'MachineSpeed',
    'TemperatureZone1',
    'TemperatureZone2',
    'Pressure',
    'ProductionCount',
    'MachineRunning',
  ];

  const sortedTags = processTagsOrder
    .map(name => tagArray.find(t => t.name === name))
    .filter(Boolean)
    .concat(tagArray.filter(t => !processTagsOrder.includes(t.name)));

  // Separar las primeras 5 variables para mostrar como gauges
  const gaugeTags = sortedTags.slice(0, 5);
  const cardTags = sortedTags.slice(5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h2>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      {tagArray.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('dashboard.noTags')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('dashboard.checkConnection')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sección de Gauges - Primeras 5 variables */}
          {gaugeTags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.mainVariables')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {gaugeTags.map((tag) => (
                  <GaugeCard key={tag.name} tag={tag} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Sección de Cards - Resto de variables */}
          {cardTags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.additionalVariables')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardTags.map((tag) => (
                  <TagCard key={tag.name} tag={tag} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
