const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * Global search across navigation_items (documents & processes) and content_text.
 * q: query string
 * limit (default 20)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const lim = Math.min(parseInt(limit, 10) || 20, 100);

    // Base: documents & processes by title/description + content_text relevance
    const rows = await query(
      `
      SELECT
        ni.id,
        ni.title,
        ni.description,
        ni.type,
        COALESCE((
          MATCH(ni.title, ni.description) AGAINST (? IN NATURAL LANGUAGE MODE)
        ), 0) +
        COALESCE((
          SELECT MATCH(cb.content_text) AGAINST (? IN NATURAL LANGUAGE MODE)
          FROM content_blocks cb
          WHERE cb.navigation_item_id = ni.id
          LIMIT 1
        ), 0) AS relevance
      FROM navigation_items ni
      WHERE ni.type IN ('document','process')
        AND (
          MATCH(ni.title, ni.description) AGAINST (? IN NATURAL LANGUAGE MODE)
          OR EXISTS (
            SELECT 1 FROM content_blocks cb
            WHERE cb.navigation_item_id = ni.id
              AND MATCH(cb.content_text) AGAINST (? IN NATURAL LANGUAGE MODE)
          )
        )
      ORDER BY relevance DESC, ni.title ASC
      LIMIT ?
      `,
      [q, q, q, q, lim]
    );

    res.json({ query: q, items: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * Tag filter: ?tag=HR&limit=20
 * Returns items tagged with a specific tag
 */
router.get('/by-tag', authenticate, async (req, res, next) => {
  try {
    const { tag, limit = 50 } = req.query;
    if (!tag) return res.status(400).json({ error: 'tag required' });
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const rows = await query(
      `
      SELECT ni.id, ni.title, ni.type
      FROM document_tags dt
      JOIN navigation_items ni ON ni.id = dt.navigation_item_id
      WHERE dt.tag = ?
      ORDER BY ni.title ASC
      LIMIT ?
      `,
      [tag, lim]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
