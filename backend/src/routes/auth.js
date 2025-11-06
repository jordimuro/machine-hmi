import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate as authService } from '../auth/authService.js';
import { authenticate } from '../auth/authMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/login
 * Authenticate with username and password
 */
router.post(
  '/login',
  body('username').isString().isLength({ min: 1, max: 50 }),
  body('password').isString().isLength({ min: 1, max: 20 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    const { username, password } = req.body;
    const result = authService(username, password);

    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result);
  }
);

/**
 * GET /api/me
 * Get current user info
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ role: req.user.role });
});

export default router;
