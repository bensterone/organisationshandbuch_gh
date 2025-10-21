const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const filesService = require('../services/files.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await filesService.listFiles({ navigation_item_id: req.query.navigation_item_id })); } catch (e) { next(e); }
});

router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const id = await filesService.saveFileRecord({
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      navigation_item_id: req.body.navigation_item_id || null,
    }, req.user.id);
    res.status(201).json({ id, filename: file.filename });
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await filesService.deleteFileRecord(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
