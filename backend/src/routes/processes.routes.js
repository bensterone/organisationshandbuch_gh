const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const proc = require('../services/processes.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await proc.listProcesses(req.query.navigation_item_id)); } catch (e) { next(e); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await proc.getProcess(req.params.id)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await proc.createProcess(req.body, req.user.id)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await proc.updateProcess(req.params.id, req.body, req.user.id)); } catch (e) { next(e); }
});

module.exports = router;
