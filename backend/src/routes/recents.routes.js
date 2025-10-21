const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * POST track a view
 * body: { navigation_item_id }
 */
router.post('/track', authenticate, async (req, res, next) => {
  try {
    const { navigation_item_id } = req.body;
    if (!navigation_item_id) return res.status(400).json({ error: 'navigation_item_id required' });
    await query(
      `INSERT INTO user_recents (user_id, navigation_item_id) VALUES (?, ?)`,
      [req.user.id, navigation_item_id]
    );
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/**
 * GET my recents (last 10)
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ni.id, ni.title, ni.type, ur.viewed_at
       FROM user_recents ur
       JOIN navigation_items ni ON ni.id = ur.navigation_item_id
       WHERE ur.user_id = ?
       ORDER BY ur.viewed_at DESC
       LIMIT 10`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
