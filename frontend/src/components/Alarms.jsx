import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlarms } from '../hooks/useWebSocket';
import apiClient from '../services/apiClient';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function AlarmRow({ alarm, t }) {
  const duration = Date.now() - alarm.since;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const formatDuration = () => {
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={`alarm-row ${alarm.active ? 'alarm-active' : ''}`}>
      <div className="flex-shrink-0">
        {alarm.active ? (
          <AlertTriangle className="w-6 h-6 text-danger-600" />
        ) : (
          <CheckCircle className="w-6 h-6 text-success-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800">{alarm.id}</div>
        <div className="text-sm text-gray-600">{alarm.message || t('alarms.noDescription')}</div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>{formatDuration()}</span>
      </div>

      <div className="text-sm text-gray-500">
        {new Date(alarm.since).toLocaleString()}
      </div>
    </div>
  );
}

export default function Alarms() {
  const { t } = useTranslation();
  const [initialAlarms, setInitialAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const alarms = useAlarms(initialAlarms);

  useEffect(() => {
    loadAlarms();
    // Refresh every second to update durations
    const interval = setInterval(() => {
      setInitialAlarms(prev => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlarms = async () => {
    try {
      const response = await apiClient.getAlarms();
      setInitialAlarms(response.alarms);
    } catch (error) {
      console.error('Failed to load alarms', error);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('alarms.title')}</h2>
          <p className="text-gray-600">
            {t('alarms.activeCount', { count: alarms.length })}
          </p>
        </div>

        {alarms.length > 0 && (
          <div className="animate-pulse-soft">
            <AlertTriangle className="w-8 h-8 text-danger-600" />
          </div>
        )}
      </div>

      {alarms.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <p className="text-gray-800 text-lg font-semibold">{t('alarms.allClear')}</p>
          <p className="text-gray-600 text-sm mt-2">{t('alarms.noActive')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms
            .sort((a, b) => b.since - a.since)
            .map((alarm) => (
              <AlarmRow key={alarm.id} alarm={alarm} t={t} />
            ))}
        </div>
      )}
    </div>
  );
}
