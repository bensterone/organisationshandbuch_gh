const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { globalSearch } = require('../services/search.service');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = req.query.limit || 20;

    if (!q) {
      return res.json({ q, navItems: [], documents: [], processes: [] });
    }

    const data = await globalSearch(q, limit);
    res.json(data);
  } catch (err) {
    console.error('Search error:', err);
    next(err);
  }
});

module.exports = router;
