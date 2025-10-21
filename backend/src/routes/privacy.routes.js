const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/** Get/update consents */
router.get('/me/consents', authenticate, async (req, res, next) => {
  try {
    const rows = await query(`SELECT consent_key, granted, granted_at FROM privacy_consents WHERE user_id=?`, [req.user.id]);
    const map = {};
    rows.forEach(r => { map[r.consent_key] = { granted: !!r.granted, granted_at: r.granted_at }; });
    res.json(map);
  } catch (e) { next(e); }
});

router.put('/me/consents', authenticate, async (req, res, next) => {
  try {
    const updates = req.body || {}; // { consent_key: boolean, ... }
    for (const [key, granted] of Object.entries(updates)) {
      await query(
        `INSERT INTO privacy_consents (user_id, consent_key, granted)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE granted=VALUES(granted), granted_at=CURRENT_TIMESTAMP`,
        [req.user.id, key, !!granted]
      );
    }
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/** Portable export of user-related data (JSON bundle) */
router.get('/me/export', authenticate, async (req, res, next) => {
  try {
    const user = await query(`SELECT id, username, email, full_name, role, created_at FROM users WHERE id=?`, [req.user.id]);
    const acks = await query(
      `SELECT ua.navigation_item_id, ni.title, ua.acknowledged_at
       FROM user_acknowledgements ua
       JOIN navigation_items ni ON ni.id = ua.navigation_item_id
       WHERE ua.user_id=? ORDER BY ua.acknowledged_at DESC`,
       [req.user.id]
    );
    const approvals = await query(
      `SELECT a.navigation_item_id, ni.title, a.version_label, a.approved_at, a.comment
       FROM approvals a
       JOIN navigation_items ni ON ni.id = a.navigation_item_id
       WHERE a.approved_by=? ORDER BY a.approved_at DESC`,
       [req.user.id]
    );

    res.json({
      user: user[0] || null,
      acknowledgements: acks,
      approvals: approvals
    });
  } catch (e) { next(e); }
});

module.exports = router;
