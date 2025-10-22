const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const proc = require('../services/processes.service');

// List processes (optionally by navigation_item_id)
router.get('/', authenticate, async (req, res, next) => {
  try {
    res.json(await proc.listProcesses(req.query.navigation_item_id));
  } catch (e) { next(e); }
});

// Latest process by navigation item id
router.get('/by-navigation/:navId', authenticate, async (req, res, next) => {
  try {
    const list = await proc.listProcesses(req.params.navId);
    if (!list || list.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(list[0]);
  } catch (e) { next(e); }
});

// Get single
router.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await proc.getProcess(req.params.id)); } catch (e) { next(e); }
});

// Create
router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await proc.createProcess(req.body, req.user.id)); } catch (e) { next(e); }
});

// Update
router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await proc.updateProcess(req.params.id, req.body, req.user.id)); } catch (e) { next(e); }
});

// Delete
router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await proc.deleteProcess(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
