const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const docs = require('../services/documents.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await docs.listDocuments(req.query.navigation_item_id)); } catch (e) { next(e); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await docs.getDocument(req.params.id)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await docs.createDocument(req.body, req.user.id)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await docs.updateDocument(req.params.id, req.body, req.user.id)); } catch (e) { next(e); }
});

module.exports = router;
