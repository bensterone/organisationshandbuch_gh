const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const wiki = require('../services/wikilinks.service');

router.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await wiki.listWikiLinksForItem(req.params.id)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await wiki.createWikiLink(req.body.from_navigation_item_id, req.body.to_navigation_item_id)); } catch (e) { next(e); }
});

router.delete('/', authenticate, async (req, res, next) => {
  try { res.json(await wiki.deleteWikiLink(req.body.from_navigation_item_id, req.body.to_navigation_item_id)); } catch (e) { next(e); }
});

module.exports = router;
