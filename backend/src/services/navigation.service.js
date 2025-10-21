const { query } = require('../config/database');

async function getNavigationItem(id) {
  const rows = await query(
    `SELECT id, parent_id, title, type, position, emoji
     FROM navigation_items WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getChildren(parentId = null) {
  const rows = await query(
    `SELECT id, parent_id, title, type, position, emoji
     FROM navigation_items
     WHERE ${parentId === null ? 'parent_id IS NULL' : 'parent_id = ?'}
     ORDER BY position ASC, title ASC`,
    parentId === null ? [] : [parentId]
  );
  return rows;
}

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

async function createItem({ parent_id, title, type, position = 0, emoji = null }, createdBy) {
  const result = await query(
    `INSERT INTO navigation_items (parent_id, title, type, position, emoji, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [parent_id ?? null, title, type, position, emoji, createdBy]
  );
  return { id: result.insertId, parent_id, title, type, position, emoji };
}

async function updateItem(id, patch = {}) {
  const fields = [];
  const params = [];
  for (const key of ['parent_id', 'title', 'type', 'position', 'emoji']) {
    if (key in patch) { fields.push(`${key} = ?`); params.push(patch[key]); }
  }
  if (!fields.length) return getNavigationItem(id);
  params.push(id);
  await query(`UPDATE navigation_items SET ${fields.join(', ')} WHERE id = ?`, params);
  return getNavigationItem(id);
}

async function deleteItem(id) {
  await query(`DELETE FROM navigation_items WHERE id = ?`, [id]);
  return { success: true };
}

module.exports = { getNavigationItem, getChildren, getBreadcrumbs, createItem, updateItem, deleteItem };
