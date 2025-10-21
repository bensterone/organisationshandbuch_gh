const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * Utility to build a nested tree from a flat list of navigation items.
 */
function buildTree(items, parentId = null) {
  const children = items.filter(i => i.parent_id === parentId);
  return children.map(i => ({
    id: i.id,
    title: i.title,
    status: i.status,
    type: i.type,
    children: buildTree(items, i.id)
  }));
}

/**
 * GET /api/navigation
 * Returns all navigation items with computed type: 'document' | 'process' | 'folder'
 */
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT n.id, n.title, n.parent_id, n.status,
             CASE
               WHEN d.id IS NOT NULL THEN 'document'
               WHEN p.id IS NOT NULL THEN 'process'
               ELSE 'folder'
             END AS type
        FROM navigation_items n
        LEFT JOIN documents d ON d.navigation_item_id = n.id
        LEFT JOIN processes p ON p.navigation_item_id = n.id
      ORDER BY n.title ASC
    `);
    res.json({ items: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/navigation/tree
 * Returns hierarchical navigation tree with all children included.
 */
router.get('/tree', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT n.id, n.title, n.parent_id, n.status,
             CASE
               WHEN d.id IS NOT NULL THEN 'document'
               WHEN p.id IS NOT NULL THEN 'process'
               ELSE 'folder'
             END AS type
        FROM navigation_items n
        LEFT JOIN documents d ON d.navigation_item_id = n.id
        LEFT JOIN processes p ON p.navigation_item_id = n.id
      ORDER BY n.parent_id ASC, n.title ASC
    `);

    const tree = buildTree(rows, null);
    res.json({ tree });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/navigation/:id
 * Returns a single navigation item with type info.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const rows = await query(`
      SELECT n.id, n.title, n.parent_id, n.status,
             CASE
               WHEN d.id IS NOT NULL THEN 'document'
               WHEN p.id IS NOT NULL THEN 'process'
               ELSE 'folder'
             END AS type
        FROM navigation_items n
        LEFT JOIN documents d ON d.navigation_item_id = n.id
        LEFT JOIN processes p ON p.navigation_item_id = n.id
       WHERE n.id = ?
      LIMIT 1
    `, [id]);

    const item = rows[0];
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/navigation/:id/status
 * Updates the status field for a navigation item.
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Missing status' });

    await query(`UPDATE navigation_items SET status = ? WHERE id = ?`, [status, id]);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
