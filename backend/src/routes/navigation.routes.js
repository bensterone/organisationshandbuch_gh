const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const nav = require('../services/navigation.service');

router.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await nav.getNavigationItem(req.params.id)); } catch (e) { next(e); }
});

router.get('/:id/children', authenticate, async (req, res, next) => {
  try { res.json(await nav.getChildren(req.params.id)); } catch (e) { next(e); }
});

router.get('/:id/breadcrumbs', authenticate, async (req, res, next) => {
  try { res.json(await nav.getBreadcrumbs(req.params.id)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await nav.createItem(req.body, req.user.id)); } catch (e) { next(e); }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try { res.json(await nav.updateItem(req.params.id, req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await nav.deleteItem(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
