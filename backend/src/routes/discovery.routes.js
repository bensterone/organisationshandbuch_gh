const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { toString, toInt } = require('../utils/validate');

// GET /api/discovery/related?q=...&limit=10
router.get('/related', asyncHandler(async (req, res) => {
  const q = toString(req.query.q, 200);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10), 1), 50);

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query "q" must be at least 2 characters' });
  }

  // Simple heuristic scoring: title like + wikilink anchors + tag names
  const rows = await query(
    `SELECT d.id, d.title, d.updated_at,
            (CASE WHEN LOWER(d.title) LIKE LOWER(?) THEN 2 ELSE 0 END
             + (SELECT COUNT(*) FROM wikilinks w WHERE w.to_document_id = d.id AND LOWER(w.anchor) LIKE LOWER(?))
             + (SELECT COUNT(*) FROM document_tags dt
                  JOIN tags t ON t.id = dt.tag_id
                WHERE dt.document_id = d.id AND LOWER(t.name) LIKE LOWER(?))
            ) AS score
       FROM documents d
      WHERE d.status = 'published'
   ORDER BY score DESC, d.updated_at DESC
      LIMIT ?`,
    [`%${q}%`, `%${q}%`, `%${q}%`, limit]
  );

  res.json(rows);
}));

module.exports = router;
