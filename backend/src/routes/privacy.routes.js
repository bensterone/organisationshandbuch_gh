const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listPrivacyDocs } = require('../services/privacy.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await listPrivacyDocs()); } catch (e) { next(e); }
});

module.exports = router;
