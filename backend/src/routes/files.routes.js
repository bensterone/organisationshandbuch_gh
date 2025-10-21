const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = require('../middleware/upload'); // your multer setup
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * POST /api/files/upload
 * Form-Data: file (binary), [navigation_item_id], [title], [description]
 */
router.post(
  '/upload',
  authenticate,
  authorize('editor', 'admin'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const {
        originalname,
        filename,        // stored filename from multer (uuid + ext)
        path: filePath,
        size,
        mimetype
      } = req.file;

      const { navigation_item_id, title, description } = req.body;

      const result = await query(
        `INSERT INTO files
         (navigation_item_id, original_filename, stored_filename, file_path, file_size, mime_type, title, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          navigation_item_id || null,
          originalname,
          filename,
          filePath,
          size,
          mimetype,
          title || null,
          description || null,
          req.user.id
        ]
      );

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/files
 * Optional query: navigation_item_id
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { navigation_item_id } = req.query;

    let sql = `SELECT f.*, u.full_name AS created_by_name
               FROM files f
               LEFT JOIN users u ON f.created_by = u.id`;
    const params = [];

    if (navigation_item_id) {
      sql += ` WHERE f.navigation_item_id = ?`;
      params.push(navigation_item_id);
    }

    sql += ` ORDER BY f.created_at DESC`;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files/:id/download
 */
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const [file] = await query(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const absolute = path.resolve(file.file_path);
    if (!fs.existsSync(absolute)) return res.status(410).json({ error: 'File missing on disk' });

    res.download(absolute, file.original_filename);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/files/:id
 */
router.delete('/:id', authenticate, authorize('editor', 'admin'), async (req, res, next) => {
  try {
    const [file] = await query(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // delete db row first
    await query(`DELETE FROM files WHERE id = ?`, [req.params.id]);

    // then try to remove disk file
    const absolute = path.resolve(file.file_path);
    if (fs.existsSync(absolute)) {
      try {
        fs.unlinkSync(absolute);
      } catch (e) {
        // If unlink fails, we still consider the deletion okay, but log it.
        console.warn('Could not delete file from disk:', absolute, e.message);
      }
    }

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
