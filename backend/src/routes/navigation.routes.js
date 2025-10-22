const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const nav = require('../services/navigation.service');
const { query } = require('../config/database');

/** Map legacy/body fields to DB schema */
function mapBodyToSchema(body = {}) {
  const mapped = { ...body };

  if (mapped.position != null && mapped.sort_order == null) {
    mapped.sort_order = mapped.position;
  }
  if (mapped.emoji != null && mapped.icon == null) {
    mapped.icon = mapped.emoji;
  }

  const allowed = [
    'parent_id', 'title', 'type', 'sort_order', 'icon',
    'description', 'status', 'created_by', 'updated_by'
  ];
  const clean = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(mapped, k)) clean[k] = mapped[k];
  }
  return clean;
}

/** GET /api/navigation — full tree */
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, parent_id, title, description, type, sort_order, icon, status,
              created_by, updated_by, created_at, updated_at
       FROM navigation_items
       ORDER BY COALESCE(parent_id, 0), sort_order ASC, title ASC`
    );

    const byId = new Map();
    for (const r of rows) {
      byId.set(r.id, {
        id: r.id,
        parent_id: r.parent_id,
        title: r.title,
        description: r.description ?? null,
        type: r.type,
        sort_order: r.sort_order ?? 0,
        icon: r.icon ?? null,
        status: r.status ?? 'draft',
        created_by: r.created_by ?? null,
        updated_by: r.updated_by ?? null,
        created_at: r.created_at ?? null,
        updated_at: r.updated_at ?? null,
        children: [],
      });
    }

    const roots = [];
    for (const node of byId.values()) {
      if (node.parent_id && byId.has(node.parent_id)) {
        byId.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    res.json(Array.isArray(roots) ? roots : []);
  } catch (e) { next(e); }
});

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
  try {
    const payload = mapBodyToSchema(req.body);
    res.status(201).json(await nav.createItem(payload, req.user.id));
  } catch (e) { next(e); }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const patch = mapBodyToSchema(req.body);
    res.json(await nav.updateItem(req.params.id, patch));
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await nav.deleteItem(req.params.id)); } catch (e) { next(e); }
});

/** NEW: PUT /api/navigation/reorder
 * Body: [{ id, parent_id (nullable), sort_order }, ...]
 * Updates the tree ordering in bulk.
 */
router.put('/reorder', authenticate, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (items.length === 0) return res.json({ success: true, updated: 0 });

    // Validate shape
    for (const it of items) {
      if (typeof it.id === 'undefined') {
        return res.status(400).json({ error: 'Each item requires id' });
      }
    }

    // Bulk update
    let updated = 0;
    for (const it of items) {
      const parent = it.parent_id ?? null;
      const order = Number.isFinite(it.sort_order) ? it.sort_order : 0;
      const result = await query(
        `UPDATE navigation_items
         SET parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [parent, order, it.id]
      );
      updated += result.affectedRows || 0;
    }

    res.json({ success: true, updated });
  } catch (e) { next(e); }
});

module.exports = router;
