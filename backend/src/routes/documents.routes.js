const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

/** Utility: extract unique [[Title]] tokens from plain text */
function extractWikiTitles(text = '') {
  const re = /\[\[([^[\]]{1,255})\]\]/g; // [[...]] up to 255 chars
  const set = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const title = m[1].trim();
    if (title) set.add(title);
  }
  return Array.from(set);
}

/** Resolve titles to navigation item IDs (exact, case-insensitive) */
async function resolveTitlesToIds(titles = []) {
  if (!titles.length) return {};
  // Build placeholders
  const params = titles.flatMap(t => [t, t]);
  const ors = titles.map(() => `(LOWER(title) = LOWER(?) OR BINARY title = ?)`).join(' OR ');
  const rows = await query(
    `SELECT id, title, type FROM navigation_items WHERE ${ors}`,
    params
  );
  const map = {};
  for (const r of rows) {
    // If multiple with same title exist, first wins (you can adjust later)
    const key = r.title;
    if (!map[key]) map[key] = { id: r.id, type: r.type };
  }
  return map;
}

/** Upsert wiki_links based on content_text for a given doc */
async function updateWikiLinksForDocument(navigationItemId, contentText) {
  const titles = extractWikiTitles(contentText || '');
  const resolved = await resolveTitlesToIds(titles);

  // Build current desired edges
  const desired = Object.entries(resolved).map(([, v]) => ({
    from: navigationItemId, to: v.id
  }));

  const existing = await query(
    `SELECT to_navigation_item_id AS to_id FROM wiki_links WHERE from_navigation_item_id = ?`,
    [navigationItemId]
  );
  const existingSet = new Set(existing.map(r => r.to_id));
  const desiredSet = new Set(desired.map(d => d.to));

  // Inserts
  for (const d of desired) {
    if (!existingSet.has(d.to)) {
      await query(
        `INSERT INTO wiki_links (from_navigation_item_id, to_navigation_item_id, link_text)
         VALUES (?, ?, (SELECT title FROM navigation_items WHERE id = ?))`,
        [d.from, d.to, d.to]
      );
    }
  }

  // Deletes no longer referenced
  for (const r of existing) {
    if (!desiredSet.has(r.to_id)) {
      await query(
        `DELETE FROM wiki_links WHERE from_navigation_item_id = ? AND to_navigation_item_id = ?`,
        [navigationItemId, r.to_id]
      );
    }
  }
}

/**
 * GET /api/documents/:id
 * Load a document by its navigation item id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [doc] = await query(
      `SELECT ni.id, ni.title, ni.description, ni.status, ni.type,
              cb.content, cb.content_text,
              u1.full_name AS created_by_name, u2.full_name AS updated_by_name,
              cb.created_at, cb.updated_at
       FROM navigation_items ni
       LEFT JOIN content_blocks cb ON cb.navigation_item_id = ni.id
       LEFT JOIN users u1 ON cb.created_by = u1.id
       LEFT JOIN users u2 ON cb.updated_by = u2.id
       WHERE ni.id = ? AND ni.type='document'`,
      [req.params.id]
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

/**
 * PUT /api/documents/:id
 * Save Editor.js JSON + plain text; update wiki_links edges
 */
router.put('/:id', authenticate, authorize('editor','admin'), async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { content, content_text } = req.body;
    if (content == null && content_text == null) {
      return res.status(400).json({ error: 'content or content_text required' });
    }

    await conn.beginTransaction();

    // Upsert content block
    const [existing] = await conn.execute(
      `SELECT id FROM content_blocks WHERE navigation_item_id=? LIMIT 1`,
      [req.params.id]
    );
    if (existing.length) {
      await conn.execute(
        `UPDATE content_blocks SET content=?, content_text=?, updated_at=NOW(), updated_by=? WHERE id=?`,
        [content || null, content_text || null, req.user.id, existing[0].id]
      );
    } else {
      await conn.execute(
        `INSERT INTO content_blocks (navigation_item_id, content, content_text, created_by, updated_by)
         VALUES (?,?,?,?,?)`,
        [req.params.id, content || null, content_text || null, req.user.id, req.user.id]
      );
    }

    // Update wiki_links edges for this document based on content_text
    // Use a separate connectionless helper with the same transaction connection if desired.
    // For simplicity, commit then run outside transaction here.
    await conn.commit();
    await updateWikiLinksForDocument(parseInt(req.params.id, 10), content_text || '');

    res.sendStatus(204);
  } catch (err) {
    await (conn?.rollback?.());
    next(err);
  } finally {
    conn?.release?.();
  }
});

/**
 * GET /api/documents/:id/backlinks
 * List items that link to this document via [[Title]]
 */
router.get('/:id/backlinks', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ni.id, ni.title, ni.type
       FROM wiki_links wl
       JOIN navigation_items ni ON ni.id = wl.from_navigation_item_id
       WHERE wl.to_navigation_item_id = ?
       ORDER BY ni.title ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
