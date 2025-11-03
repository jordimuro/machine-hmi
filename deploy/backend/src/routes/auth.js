import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate as authService } from '../auth/authService.js';
import { authenticate } from '../auth/authMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/login
 * Authenticate with PIN
 */
router.post(
  '/login',
  body('pin').isString().isLength({ min: 4, max: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    const { pin } = req.body;
    const result = authService(pin);

    if (!result) {
      return res.status(401).json({ error: 'Invalid PIN' });
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
