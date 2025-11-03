import express from 'express';
import alarmStore from '../stores/alarmStore.js';
import { optionalAuth } from '../auth/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/alarms
 * Get all active alarms
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const alarms = alarmStore.getActiveAlarms();
    res.json({ alarms, count: alarms.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve alarms' });
  }
});

/**
 * GET /api/alarms/all
 * Get all alarms (including inactive)
 */
router.get('/all', optionalAuth, (req, res) => {
  try {
    const alarms = alarmStore.getAll();
    res.json({ alarms, count: alarms.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve alarms' });
  }
});

export default router;
