const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${ts}-${safe}`);
  },
});
const upload = multer({ storage });

// list
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { navigation_item_id } = req.query;
    const rows = await query(
      `SELECT id, filename, original_name, mime_type, size, navigation_item_id, created_by, created_at
       FROM files
       ${navigation_item_id ? 'WHERE navigation_item_id = ?' : ''}
       ORDER BY created_at DESC`,
      navigation_item_id ? [navigation_item_id] : []
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// upload
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { navigation_item_id = null } = req.body || {};
    const result = await query(
      `INSERT INTO files (filename, original_name, mime_type, size, navigation_item_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        navigation_item_id || null,
        req.user?.id || null,
      ]
    );
    const [row] = await query(`SELECT * FROM files WHERE id = ?`, [result.insertId]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

// download
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const [file] = await query(
      `SELECT id, filename, original_name, mime_type FROM files WHERE id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!file) return res.status(404).json({ error: 'Not found' });
    const abs = path.resolve(uploadDir, file.filename);
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing' });
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.original_name || file.filename)}"`
    );
    return res.download(abs, file.original_name || file.filename);
  } catch (e) { next(e); }
});

// delete
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const [file] = await query(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!file) return res.status(404).json({ error: 'Not found' });
    await query(`DELETE FROM files WHERE id = ?`, [req.params.id]);
    const abs = path.resolve(uploadDir, file.filename);
    if (fs.existsSync(abs)) try { fs.unlinkSync(abs); } catch {}
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
