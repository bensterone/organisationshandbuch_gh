const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET /api/favorites -> []
router.get('/', authenticate, async (_req, res) => {
  res.json([]); // stub: no favorites yet
});

// POST /api/favorites/:navId -> { success: true }
router.post('/:navId', authenticate, async (_req, res) => {
  res.status(201).json({ success: true });
});

// DELETE /api/favorites/:navId -> { success: true }
router.delete('/:navId', authenticate, async (_req, res) => {
  res.json({ success: true });
});

module.exports = router;
