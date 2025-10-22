const { query } = require('../config/database');

/**
 * Map DB row to API shape. We keep API fields as title/type/sort_order/icon etc.
 * If the frontend expects 'position' or 'emoji', you can add aliases there – but
 * here we'll stick to your DB names.
 */
function mapNavRow(r) {
  return {
    id: r.id,
    parent_id: r.parent_id,
    title: r.title,
    type: r.type,
    sort_order: r.sort_order ?? 0,
    icon: r.icon ?? null,
    description: r.description ?? null,
    status: r.status ?? 'draft',
    created_by: r.created_by ?? null,
    updated_by: r.updated_by ?? null,
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}

/** Fetch a navigation item by id. */
async function getNavigationItem(id) {
  const rows = await query(
    `SELECT id, parent_id, title, description, type, sort_order, icon, status,
            created_by, updated_by, created_at, updated_at
     FROM navigation_items
     WHERE id = ?`,
    [id]
  );
  return rows[0] ? mapNavRow(rows[0]) : null;
}

/** Get children of a navigation node. */
async function getChildren(parentId = null) {
  const where = parentId === null ? 'parent_id IS NULL' : 'parent_id = ?';
  const params = parentId === null ? [] : [parentId];
  const rows = await query(
    `SELECT id, parent_id, title, description, type, sort_order, icon, status,
            created_by, updated_by, created_at, updated_at
     FROM navigation_items
     WHERE ${where}
     ORDER BY sort_order ASC, title ASC`,
    params
  );
  return rows.map(mapNavRow);
}

/** Build breadcrumb chain (root → node). */
async function getBreadcrumbs(id) {
  const chain = [];
  let currentId = id;
  for (let i = 0; i < 50 && currentId; i++) {
    const node = await getNavigationItem(currentId);
    if (!node) break;
    chain.push(node);
    currentId = node.parent_id;
  }
  return chain.reverse();
}

/** Create a new navigation item. */
async function createItem(
  { parent_id = null, title, type = 'folder', sort_order = 0, icon = null, description = null, status = 'draft' },
  createdBy
) {
  const result = await query(
    `INSERT INTO navigation_items
       (parent_id, title, type, sort_order, icon, description, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [parent_id, title, type, sort_order, icon, description, status, createdBy || null]
  );
  return getNavigationItem(result.insertId);
}

/** Update a navigation item. Accepts partial patch. */
async function updateItem(id, patch = {}) {
  // Allowed fields you actually have in DB:
  const allowed = ['parent_id', 'title', 'type', 'sort_order', 'icon', 'description', 'status', 'updated_by'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      sets.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }
  if (!sets.length) return getNavigationItem(id);

  // Always bump updated_at
  sets.push('updated_at = NOW()');

  params.push(id);
  await query(`UPDATE navigation_items SET ${sets.join(', ')} WHERE id = ?`, params);
  return getNavigationItem(id);
}

/** Delete a navigation item (DB will handle children per your constraints). */
async function deleteItem(id) {
  await query(`DELETE FROM navigation_items WHERE id = ?`, [id]);
  return { success: true };
}

module.exports = {
  getNavigationItem,
  getChildren,
  getBreadcrumbs,
  createItem,
  updateItem,
  deleteItem,
};
