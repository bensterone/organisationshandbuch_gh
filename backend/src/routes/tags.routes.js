const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET /api/tags -> []   (all tags)
router.get('/', authenticate, async (_req, res) => {
  res.json([]); // stub: no tags yet
});

// GET /api/tags/by-navigation/:navId -> []   (tags for a nav item)
router.get('/by-navigation/:navId', authenticate, async (_req, res) => {
  res.json([]); // stub: none for item
});

// PUT /api/tags/by-navigation/:navId -> { success: true }  (set tags list)
router.put('/by-navigation/:navId', authenticate, async (_req, res) => {
  // Expect body: { tags: ["alpha", "beta"] }
  res.json({ success: true });
});

module.exports = router;
