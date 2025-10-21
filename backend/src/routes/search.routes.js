const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const search = require('../services/search.service');
const docs = require('../services/documents.service');

router.get('/suggest', authenticate, async (req, res, next) => {
  try { res.json(await search.suggestNavigationTitles(req.query.q || '')); } catch (e) { next(e); }
});

router.get('/resolve', authenticate, async (req, res, next) => {
  try { res.json(await search.resolveTitlesToNavIds((req.query.titles || '').split(',').map(s => s.trim()).filter(Boolean))); } catch (e) { next(e); }
});

router.get('/documents', authenticate, async (req, res, next) => {
  try { res.json(await docs.searchDocuments(req.query.q || '')); } catch (e) { next(e); }
});

module.exports = router;
