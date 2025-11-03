import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../auth/authMiddleware.js';
import opcuaClient from '../opcua/opcuaClient.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/cmd
 * Execute a command (requires maintenance role)
 * Body: { command: string, params?: object }
 */
router.post(
  '/',
  authenticate,
  requireRole('maintenance'),
  body('command').isString().trim().notEmpty(),
  body('params').optional().isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request', details: errors.array() });
    }

    const { command, params = {} } = req.body;

    try {
      logger.info({ command, params, user: req.user.role }, 'Command execution requested');

      const result = await opcuaClient.executeCommand(command, params);

      res.json({
        success: true,
        command,
        result,
      });
    } catch (error) {
      logger.error({ err: error, command, params }, 'Command execution failed');
      res.status(500).json({
        success: false,
        error: error.message || 'Command execution failed',
      });
    }
  }
);

/**
 * GET /api/cmd/status
 * Get OPC UA connection status
 */
router.get('/status', authenticate, (req, res) => {
  try {
    const status = opcuaClient.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
