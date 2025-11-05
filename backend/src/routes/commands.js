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

/**
 * GET /api/cmd/browse?nodeId=xxx&type=xxx
 * Browse OPC UA server nodes (for variable discovery)
 */
router.get('/browse', authenticate, async (req, res) => {
  try {
    const nodeId = req.query.nodeId;
    const browseType = req.query.type || 'general'; // 'general', 'application', 'variables'
    const recursive = req.query.recursive !== 'false';
    const maxDepth = parseInt(req.query.maxDepth) || 4;
    
    // Verificar estado de conexión primero
    const status = opcuaClient.getStatus();
    if (!status.connected) {
      return res.json({ 
        error: 'OPC UA server not connected',
        nodes: [],
        count: 0
      });
    }
    
    let result;
    
    if (browseType === 'application') {
      // Búsqueda específica para variables de aplicación CODESYS
      result = await opcuaClient.browseApplicationVariables();
    } else if (nodeId) {
      // Explorar un nodo específico
      result = await opcuaClient.browseNodes(nodeId, {
        recursive,
        maxDepth,
        variablesOnly: browseType === 'variables'
      });
    } else {
      // Exploración general desde la raíz
      result = await opcuaClient.browseNodes('RootFolder', {
        recursive: true,
        maxDepth: 3,
        variablesOnly: browseType === 'variables'
      });
    }
    
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Browse nodes failed');
    res.json({ 
      error: error.message || 'Failed to browse nodes',
      nodes: [],
      count: 0
    });
  }
});

/**
 * POST /api/cmd/add-variables
 * Add new variables to monitoring (requires maintenance role)
 */
router.post(
  '/add-variables',
  authenticate,
  requireRole('maintenance'),
  body('variables').isArray().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request', details: errors.array() });
    }

    const { variables } = req.body;

    try {
      logger.info({ variableCount: variables.length, user: req.user.role }, 'Adding new variables to monitoring');

      const result = await opcuaClient.addVariables(variables);

      res.json({
        success: true,
        addedVariables: result.added,
        skippedVariables: result.skipped,
        totalAdded: result.added.length
      });
    } catch (error) {
      logger.error({ err: error, variables }, 'Failed to add variables');
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add variables',
      });
    }
  }
);

export default router;
