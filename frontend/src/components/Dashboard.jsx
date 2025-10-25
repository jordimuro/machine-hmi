import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTags } from '../hooks/useWebSocket';
import apiClient from '../services/apiClient';
import { Activity, Gauge, Thermometer, Zap, Package, AlertTriangle } from 'lucide-react';

const TAG_ICONS = {
  MachineSpeed: Gauge,
  TemperatureZone1: Thermometer,
  TemperatureZone2: Thermometer,
  Pressure: Zap,
  ProductionCount: Package,
  MachineRunning: Activity,
};

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
  const processTagsOrder = [
    'MachineRunning',
    'MachineSpeed',
    'TemperatureZone1',
    'TemperatureZone2',
    'Pressure',
    'ProductionCount',
  ];

  const sortedTags = processTagsOrder
    .map(name => tagArray.find(t => t.name === name))
    .filter(Boolean)
    .concat(tagArray.filter(t => !processTagsOrder.includes(t.name)));

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTags.map((tag) => (
            <TagCard key={tag.name} tag={tag} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
