const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET /api/recents  -> []
router.get('/', authenticate, async (_req, res) => {
  res.json([]); // stub: no recents yet
});

// POST /api/recents/track  -> { success: true }
router.post('/track', authenticate, async (_req, res) => {
  // You can persist {_req.body.entity_type, _req.body.entity_id, user_id} later
  res.json({ success: true });
});

// (Optional) POST /api/recents -> { success: true }
router.post('/', authenticate, async (_req, res) => {
  res.status(201).json({ success: true });
});

module.exports = router;
