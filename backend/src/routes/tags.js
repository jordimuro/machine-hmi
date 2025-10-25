import express from 'express';
import { param } from 'express-validator';
import tagStore from '../stores/tagStore.js';
import { optionalAuth } from '../auth/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/tags
 * Get all tags
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const tags = tagStore.getAll();
    res.json({ tags, count: tags.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
});

/**
 * GET /api/tags/:name
 * Get specific tag by name
 */
router.get(
  '/:name',
  optionalAuth,
  param('name').isString().trim().notEmpty(),
  (req, res) => {
    try {
      const { name } = req.params;
      const tag = tagStore.get(name);

      if (!tag) {
        return res.status(404).json({ error: `Tag '${name}' not found` });
      }

      res.json(tag);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve tag' });
    }
  }
);

export default router;
