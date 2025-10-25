import express from 'express';
import { query, validationResult } from 'express-validator';
import historyStore from '../stores/historyStore.js';
import { optionalAuth } from '../auth/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/history
 * Get historical data for a tag
 * Query params: tag, from (timestamp), to (timestamp)
 */
router.get(
  '/',
  optionalAuth,
  query('tag').isString().trim().notEmpty(),
  query('from').optional().isInt({ min: 0 }).toInt(),
  query('to').optional().isInt({ min: 0 }).toInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid query parameters', details: errors.array() });
    }

    try {
      const { tag } = req.query;
      const from = req.query.from || Date.now() - 3600000; // Default: last hour
      const to = req.query.to || Date.now();

      if (from > to) {
        return res.status(400).json({ error: 'Invalid time range: from > to' });
      }

      const data = historyStore.query(tag, from, to);

      res.json({
        tag,
        from,
        to,
        data,
        count: data.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve history' });
    }
  }
);

/**
 * GET /api/history/tags
 * Get list of available tags in history
 */
router.get('/tags', optionalAuth, (req, res) => {
  try {
    const tags = historyStore.getAvailableTags();
    res.json({ tags, count: tags.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve available tags' });
  }
});

export default router;
