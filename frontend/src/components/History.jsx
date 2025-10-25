import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/apiClient';
import { TrendingUp, Calendar, RefreshCw } from 'lucide-react';

export default function History() {
  const { t } = useTranslation();

  const TIME_RANGES = [
    { label: t('time.1hour'), value: 3600000 },
    { label: t('time.6hours'), value: 21600000 },
    { label: t('time.12hours'), value: 43200000 },
    { label: t('time.24hours'), value: 86400000 },
  ];
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [timeRange, setTimeRange] = useState(3600000); // Default: 1 hour
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailableTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      loadHistory();
    }
  }, [selectedTag, timeRange]);

  const loadAvailableTags = async () => {
    try {
      const response = await apiClient.getAvailableHistoryTags();
      setAvailableTags(response.tags);
      if (response.tags.length > 0 && !selectedTag) {
        setSelectedTag(response.tags[0]);
      }
    } catch (err) {
      console.error('Failed to load available tags', err);
      setError(t('history.errorLoadingTags'));
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const to = Date.now();
      const from = to - timeRange;

      const response = await apiClient.getHistory(selectedTag, from, to);

      // Transform data for Recharts
      const chartData = response.data.map(point => ({
        timestamp: point.timestamp,
        time: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value,
        quality: point.quality,
      }));

      setData(chartData);
    } catch (err) {
      console.error('Failed to load history', err);
      setError(t('history.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <p className="text-sm text-primary-600">
            {t('history.value')}: <span className="font-bold">{data.value.toFixed(2)}</span>
          </p>
          <p className="text-xs text-gray-500">{t('history.quality')}: {data.quality}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-7 h-7" />
          {t('history.title')}
        </h2>
        <p className="text-gray-600">{t('history.subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('history.selectTag')}
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-base"
            >
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t('history.timeRange')}
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-base"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={loadHistory}
              disabled={loading || !selectedTag}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {t('history.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {error ? (
        <div className="card text-center py-12">
          <p className="text-danger-600 text-lg font-semibold">{error}</p>
        </div>
      ) : availableTags.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('history.noData')}</p>
          <p className="text-gray-500 text-sm mt-2">
            {t('history.dataCollected')}
          </p>
        </div>
      ) : loading ? (
        <div className="card flex items-center justify-center py-12">
          <div className="spinner w-16 h-16" />
        </div>
      ) : data.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">{t('history.noDataRange')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('history.tryDifferent')}</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedTag} - {t('history.last')} {TIME_RANGES.find(r => r.value === timeRange)?.label}
          </h3>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 3 }}
                activeDot={{ r: 5 }}
                name={selectedTag}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">{t('history.average')}</div>
              <div className="text-xl font-bold text-gray-800">
                {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">{t('history.minimum')}</div>
              <div className="text-xl font-bold text-gray-800">
                {Math.min(...data.map(d => d.value)).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">{t('history.maximum')}</div>
              <div className="text-xl font-bold text-gray-800">
                {Math.max(...data.map(d => d.value)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
