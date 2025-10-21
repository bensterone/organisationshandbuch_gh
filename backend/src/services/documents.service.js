const { query } = require('../config/database');

async function listDocuments(navigation_item_id) {
  const rows = await query(
    `SELECT d.id, d.navigation_item_id, d.title, d.content, d.updated_at, u.full_name AS updated_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.updated_by
     WHERE d.navigation_item_id = ?
     ORDER BY d.updated_at DESC`,
    [navigation_item_id]
  );
  return rows;
}

async function getDocument(id) {
  const rows = await query(
    `SELECT d.*, u.full_name AS updated_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.updated_by
     WHERE d.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createDocument({ navigation_item_id, title, content }, userId) {
  const result = await query(
    `INSERT INTO documents (navigation_item_id, title, content, updated_by)
     VALUES (?, ?, ?, ?)`,
    [navigation_item_id, title, content, userId]
  );
  return getDocument(result.insertId);
}

async function updateDocument(id, { title, content }, userId) {
  const sets = [];
  const params = [];
  if (title !== undefined) { sets.push('title = ?'); params.push(title); }
  if (content !== undefined) { sets.push('content = ?'); params.push(content); }
  sets.push('updated_by = ?'); params.push(userId);
  params.push(id);
  await query(`UPDATE documents SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
  return getDocument(id);
}

async function searchDocuments(q) {
  const like = `%${q}%`;
  return await query(
    `SELECT id, title, navigation_item_id
     FROM documents
     WHERE title LIKE ? OR content LIKE ?
     ORDER BY updated_at DESC
     LIMIT 50`,
    [like, like]
  );
}

module.exports = { listDocuments, getDocument, createDocument, updateDocument, searchDocuments };
