const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET tags for a navigation item
 */
router.get('/:navId', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT tag FROM document_tags WHERE navigation_item_id=? ORDER BY tag ASC`,
      [req.params.navId]
    );
    res.json(rows.map(r => r.tag));
  } catch (e) { next(e); }
});

/**
 * PUT tags for a navigation item (replace full set)
 * body: { tags: string[] }
 */
router.put('/:navId', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    const { tags = [] } = req.body;
    const clean = Array.from(new Set((tags || [])
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 50)));

    await query(`DELETE FROM document_tags WHERE navigation_item_id=?`, [req.params.navId]);
    if (clean.length) {
      const values = clean.map(t => `(${parseInt(req.params.navId, 10)}, ?)`).join(',');
      await query(`INSERT INTO document_tags (navigation_item_id, tag) VALUES ${values}`, clean);
    }
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/**
 * GET popular tags
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT tag, COUNT(*) as count FROM document_tags GROUP BY tag ORDER BY count DESC, tag ASC LIMIT 100`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
