import logger from '../config/logger.js';

/**
 * AlarmStore - In-memory store for active alarms
 *
 * AlarmEntry: {
 *   id: string,
 *   active: boolean,
 *   message: string,
 *   since: number (ms epoch)
 * }
 */
class AlarmStore {
  constructor() {
    this.alarms = new Map();
    this.listeners = new Set();
  }

  /**
   * Set or update an alarm
   */
  setAlarm(id, active, message = '') {
    const existingAlarm = this.alarms.get(id);

    if (active) {
      // Activate alarm
      if (!existingAlarm || !existingAlarm.active) {
        const alarm = {
          id,
          active: true,
          message,
          since: Date.now(),
        };
        this.alarms.set(id, alarm);
        logger.warn({ alarmId: id, message }, 'Alarm activated');
        this.notifyListeners(alarm);
      }
    } else {
      // Deactivate alarm
      if (existingAlarm && existingAlarm.active) {
        const alarm = {
          id,
          active: false,
          message,
          since: existingAlarm.since,
        };
        this.alarms.set(id, alarm);
        logger.info({ alarmId: id }, 'Alarm deactivated');
        this.notifyListeners(alarm);

        // Remove from map after notification
        setTimeout(() => this.alarms.delete(id), 1000);
      }
    }
  }

  /**
   * Get an alarm by ID
   */
  get(id) {
    return this.alarms.get(id);
  }

  /**
   * Get all active alarms
   */
  getActiveAlarms() {
    return Array.from(this.alarms.values()).filter(alarm => alarm.active);
  }

  /**
   * Get all alarms (including inactive)
   */
  getAll() {
    return Array.from(this.alarms.values());
  }

  /**
   * Clear all alarms
   */
  clearAll() {
    const activeAlarms = this.getActiveAlarms();
    activeAlarms.forEach(alarm => {
      this.setAlarm(alarm.id, false, alarm.message);
    });
    logger.info('All alarms cleared');
  }

  /**
   * Register a listener for alarm updates
   * Listener signature: (alarmEntry) => void
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Unregister a listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of alarm update
   */
  notifyListeners(alarmEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(alarmEntry);
      } catch (error) {
        logger.error({ err: error, alarmId: alarmEntry.id }, 'Error in alarm listener');
      }
    });
  }
}

// Singleton instance
const alarmStore = new AlarmStore();

export default alarmStore;
