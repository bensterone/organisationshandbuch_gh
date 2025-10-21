const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tags = require('../services/tags.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await tags.listTags()); } catch (e) { next(e); }
});

router.get('/document/:id', authenticate, async (req, res, next) => {
  try { res.json(await tags.listTagsForDocument(req.params.id)); } catch (e) { next(e); }
});

router.post('/attach', authenticate, async (req, res, next) => {
  try { res.status(201).json(await tags.attachTag(req.body.document_id, req.body.tag_id)); } catch (e) { next(e); }
});

router.post('/detach', authenticate, async (req, res, next) => {
  try { res.json(await tags.detachTag(req.body.document_id, req.body.tag_id)); } catch (e) { next(e); }
});

module.exports = router;
