const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/wikilinks/resolve?titles=A,B,C
 * Returns map: { "A": { id, type, title }, ... }
 */
router.get('/resolve', authenticate, async (req, res, next) => {
  try {
    const raw = req.query.titles || '';
    const titles = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!titles.length) return res.json({});

    const params = titles.flatMap(t => [t, t]);
    const ors = titles.map(() => `(LOWER(title)=LOWER(?) OR BINARY title=?)`).join(' OR ');

    const rows = await query(
      `SELECT id, title, type FROM navigation_items WHERE ${ors}`,
      params
    );
    const map = {};
    for (const r of rows) {
      if (!map[r.title]) map[r.title] = { id: r.id, type: r.type, title: r.title };
    }
    res.json(map);
  } catch (e) { next(e); }
});

/**
 * GET /api/wikilinks/search?q=term
 * Returns up to 10 documents/processes whose titles match term (case-insensitive)
 */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const rows = await query(
      `SELECT id, title, type 
       FROM navigation_items 
       WHERE LOWER(title) LIKE LOWER(?) 
       ORDER BY title ASC 
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (e) { next(e); }
});


module.exports = router;
