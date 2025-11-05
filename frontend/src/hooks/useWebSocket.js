import { useState, useEffect } from 'react';
import wsClient from '../services/wsClient';

/**
 * Hook for WebSocket connection status
 */
export function useWebSocketStatus() {
  const [connected, setConnected] = useState(wsClient.isConnected());

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);

    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
    };
  }, []);

  return connected;
}

/**
 * Hook for tag updates
 */
export function useTagUpdates(callback) {
  useEffect(() => {
    wsClient.on('tag_update', callback);

    return () => {
      wsClient.off('tag_update', callback);
    };
  }, [callback]);
}

/**
 * Hook for alarm updates
 */
export function useAlarmUpdates(callback) {
  useEffect(() => {
    wsClient.on('alarm_update', callback);

    return () => {
      wsClient.off('alarm_update', callback);
    };
  }, [callback]);
}

/**
 * Hook to manage a single tag value
 */
export function useTag(tagName, initialValue = null) {
  const [tagValue, setTagValue] = useState(initialValue);

  useEffect(() => {
    const handleUpdate = (tag) => {
      if (tag.name === tagName) {
        setTagValue(tag);
      }
    };

    wsClient.on('tag_update', handleUpdate);

    return () => {
      wsClient.off('tag_update', handleUpdate);
    };
  }, [tagName]);

  return tagValue;
}

/**
 * Hook to manage all tags
 */
export function useTags(initialTags = []) {
  const [tags, setTags] = useState(() => {
    const tagMap = new Map();
    initialTags.forEach(tag => {
      tagMap.set(tag.name, tag);
    });
    return tagMap;
  });

  useEffect(() => {
    const handleUpdate = (tag) => {
      setTags(prev => {
        const newTags = new Map(prev);
        newTags.set(tag.name, tag);
        return newTags;
      });
    };

    wsClient.on('tag_update', handleUpdate);

    return () => {
      wsClient.off('tag_update', handleUpdate);
    };
  }, []);

  return tags;
}

/**
 * Hook to manage alarms
 */
export function useAlarms(initialAlarms = []) {
  const [alarms, setAlarms] = useState(() => {
    const alarmMap = new Map();
    initialAlarms.forEach(alarm => {
      if (alarm.active) {
        alarmMap.set(alarm.id, alarm);
      }
    });
    return alarmMap;
  });

  useEffect(() => {
    const handleUpdate = (alarm) => {
      setAlarms(prev => {
        const newAlarms = new Map(prev);
        if (alarm.active) {
          newAlarms.set(alarm.id, alarm);
        } else {
          newAlarms.delete(alarm.id);
        }
        return newAlarms;
      });
    };

    wsClient.on('alarm_update', handleUpdate);

    return () => {
      wsClient.off('alarm_update', handleUpdate);
    };
  }, []);

  return Array.from(alarms.values());
}
/**
 * Hook for complete WebSocket data management
 */
export function useWebSocket() {
  const [data, setData] = useState({
    tags: {},
    alarms: [],
    opcua: {
      connected: false,
      endpoint: null,
      mockMode: false,
      lastError: null
    }
  });
  const [isConnected, setIsConnected] = useState(wsClient.isConnected());

  useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    const handleTagUpdate = (tag) => {
      setData(prev => ({
        ...prev,
        tags: {
          ...prev.tags,
          [tag.name]: tag
        }
      }));
    };

    const handleAlarmUpdate = (alarm) => {
      setData(prev => {
        const alarms = prev.alarms.filter(a => a.id !== alarm.id);
        if (alarm.active) {
          alarms.push(alarm);
        }
        return {
          ...prev,
          alarms
        };
      });
    };

    const handleOpcuaStatus = (status) => {
      setData(prev => ({
        ...prev,
        opcua: {
          ...prev.opcua,
          ...status
        }
      }));
    };

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('tag_update', handleTagUpdate);
    wsClient.on('alarm_update', handleAlarmUpdate);
    wsClient.on('opcua_status', handleOpcuaStatus);

    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      wsClient.off('tag_update', handleTagUpdate);
      wsClient.off('alarm_update', handleAlarmUpdate);
      wsClient.off('opcua_status', handleOpcuaStatus);
    };
  }, []);

  return { data, isConnected };
}