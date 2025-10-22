const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDiscoveryForUser } = require('../services/discovery.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await getDiscoveryForUser(req.user.id)); } catch (e) { next(e); }
});

module.exports = router;
