const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rec = require('../services/recents.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await rec.listRecents(req.user.id, parseInt(req.query.limit) || 20)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await rec.trackVisit(req.user.id, req.body.navigation_item_id)); } catch (e) { next(e); }
});

module.exports = router;
