const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET my favorites
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ni.id, ni.title, ni.type
       FROM user_favorites uf
       JOIN navigation_items ni ON ni.id = uf.navigation_item_id
       WHERE uf.user_id = ?
       ORDER BY ni.title ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/**
 * POST toggle favorite
 * body: { navigation_item_id }
 */
router.post('/toggle', authenticate, async (req, res, next) => {
  try {
    const { navigation_item_id } = req.body;
    if (!navigation_item_id) return res.status(400).json({ error: 'navigation_item_id required' });

    const [exists] = await query(
      `SELECT id FROM user_favorites WHERE user_id=? AND navigation_item_id=?`,
      [req.user.id, navigation_item_id]
    );
    if (exists) {
      await query(`DELETE FROM user_favorites WHERE id=?`, [exists.id]);
      return res.json({ favorited: false });
    } else {
      await query(
        `INSERT INTO user_favorites (user_id, navigation_item_id) VALUES (?, ?)`,
        [req.user.id, navigation_item_id]
      );
      return res.json({ favorited: true });
    }
  } catch (e) { next(e); }
});

/**
 * GET is favorite?
 */
router.get('/is-favorite/:navId', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT 1 FROM user_favorites WHERE user_id=? AND navigation_item_id=? LIMIT 1`,
      [req.user.id, req.params.navId]
    );
    res.json({ isFavorite: rows.length > 0 });
  } catch (e) { next(e); }
});

module.exports = router;
