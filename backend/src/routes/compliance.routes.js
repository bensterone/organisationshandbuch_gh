const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

/** -------- Responsibilities (owner / reviewer) ---------- **/

router.get('/responsibilities/:navId', authenticate, async (req, res, next) => {
  try {
    const [row] = await query(
      `SELECT dr.*, u1.full_name AS owner_name, u2.full_name AS reviewer_name
       FROM document_responsibilities dr
       LEFT JOIN users u1 ON dr.owner_user_id = u1.id
       LEFT JOIN users u2 ON dr.reviewer_user_id = u2.id
       WHERE dr.navigation_item_id = ?`,
       [req.params.navId]
    );
    res.json(row || null);
  } catch (e) { next(e); }
});

router.put('/responsibilities/:navId', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    const { owner_user_id = null, reviewer_user_id = null } = req.body;
    const exists = await query(`SELECT id FROM document_responsibilities WHERE navigation_item_id=?`, [req.params.navId]);
    if (exists.length) {
      await query(
        `UPDATE document_responsibilities
         SET owner_user_id=?, reviewer_user_id=?, updated_at=NOW()
         WHERE navigation_item_id=?`,
        [owner_user_id, reviewer_user_id, req.params.navId]
      );
    } else {
      await query(
        `INSERT INTO document_responsibilities (navigation_item_id, owner_user_id, reviewer_user_id)
         VALUES (?, ?, ?)`,
        [req.params.navId, owner_user_id, reviewer_user_id]
      );
    }
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/** -------- Review cycle / expiry ---------- **/

router.get('/review/:navId', authenticate, async (req, res, next) => {
  try {
    const [row] = await query(
      `SELECT * FROM document_reviews WHERE navigation_item_id=?`,
      [req.params.navId]
    );
    res.json(row || null);
  } catch (e) { next(e); }
});

router.put('/review/:navId', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    const { review_interval_days = 365, next_review_at = null } = req.body;
    const exists = await query(`SELECT id FROM document_reviews WHERE navigation_item_id=?`, [req.params.navId]);
    if (exists.length) {
      await query(
        `UPDATE document_reviews
         SET review_interval_days=?, next_review_at=?, updated_at=NOW()
         WHERE navigation_item_id=?`,
        [parseInt(review_interval_days, 10), next_review_at || null, req.params.navId]
      );
    } else {
      await query(
        `INSERT INTO document_reviews (navigation_item_id, review_interval_days, next_review_at)
         VALUES (?, ?, ?)`,
        [req.params.navId, parseInt(review_interval_days, 10), next_review_at || null]
      );
    }
    res.sendStatus(204);
  } catch (e) { next(e); }
});

router.post('/review/:navId/mark-reviewed', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    // set last_reviewed_at = today; next_review_at = today + interval
    const [row] = await query(`SELECT review_interval_days FROM document_reviews WHERE navigation_item_id=?`, [req.params.navId]);
    const days = row?.review_interval_days || 365;
    await query(
      `UPDATE document_reviews
       SET last_reviewed_at = CURDATE(), next_review_at = DATE_ADD(CURDATE(), INTERVAL ? DAY), updated_at=NOW()
       WHERE navigation_item_id=?`,
      [days, req.params.navId]
    );
    // audit
    await query(
      `INSERT INTO audit_events (user_id, action, entity_type, entity_id, meta)
       VALUES (?, 'DOC_REVIEWED', 'document', ?, JSON_OBJECT('days', ?))`,
      [req.user.id, req.params.navId, days]
    );
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/** -------- Approvals ---------- **/

router.get('/approvals/:navId', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT a.*, u.full_name AS approved_by_name
       FROM approvals a
       JOIN users u ON a.approved_by = u.id
       WHERE a.navigation_item_id=?
       ORDER BY a.approved_at DESC`,
      [req.params.navId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/approvals/:navId', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    const { version_label = null, comment = null } = req.body;
    await query(
      `INSERT INTO approvals (navigation_item_id, version_label, approved_by, comment)
       VALUES (?, ?, ?, ?)`,
      [req.params.navId, version_label, req.user.id, comment]
    );
    await query(
      `INSERT INTO audit_events (user_id, action, entity_type, entity_id, meta)
       VALUES (?, 'APPROVE', 'document', ?, JSON_OBJECT('version', ?, 'comment', ?))`,
      [req.user.id, req.params.navId, version_label, comment]
    );
    res.sendStatus(201);
  } catch (e) { next(e); }
});

/** -------- Acknowledgements ---------- **/

router.get('/ack/:navId', authenticate, async (req, res, next) => {
  try {
    const total = await query(`SELECT COUNT(*) AS c FROM user_acknowledgements WHERE navigation_item_id=?`, [req.params.navId]);
    const list = await query(
      `SELECT ua.*, u.full_name FROM user_acknowledgements ua
       JOIN users u ON u.id = ua.user_id
       WHERE ua.navigation_item_id = ?
       ORDER BY ua.acknowledged_at DESC`,
      [req.params.navId]
    );
    res.json({ count: total[0]?.c || 0, list });
  } catch (e) { next(e); }
});

router.post('/ack/:navId', authenticate, async (req, res, next) => {
  try {
    await query(
      `INSERT INTO user_acknowledgements (user_id, navigation_item_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE acknowledged_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.params.navId]
    );
    await query(
      `INSERT INTO audit_events (user_id, action, entity_type, entity_id)
       VALUES (?, 'ACK', 'document', ?)`,
      [req.user.id, req.params.navId]
    );
    res.sendStatus(204);
  } catch (e) { next(e); }
});

/** -------- Reports ---------- **/

router.get('/report/overview', authenticate, authorize('editor','admin'), async (req, res, next) => {
  try {
    const due = await query(
      `SELECT ni.id, ni.title, dr.next_review_at
       FROM navigation_items ni
       JOIN document_reviews dr ON dr.navigation_item_id = ni.id
       WHERE ni.type IN ('document','process')
         AND (dr.next_review_at IS NULL OR dr.next_review_at <= CURDATE())
       ORDER BY dr.next_review_at IS NULL DESC, dr.next_review_at ASC`
    );

    const approvals = await query(
      `SELECT a.navigation_item_id AS id, MAX(a.approved_at) AS last_approved_at
       FROM approvals a GROUP BY a.navigation_item_id`
    );

    const ackCounts = await query(
      `SELECT navigation_item_id AS id, COUNT(*) AS ack_count
       FROM user_acknowledgements GROUP BY navigation_item_id`
    );

    res.json({ dueForReview: due, approvals, acknowledgements: ackCounts });
  } catch (e) { next(e); }
});

module.exports = router;
