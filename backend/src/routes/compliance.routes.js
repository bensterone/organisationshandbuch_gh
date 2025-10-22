const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listCompliance } = require('../services/compliance.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await listCompliance()); } catch (e) { next(e); }
});

module.exports = router;
