// backend/src/services/documents.service.js
const { query } = require('../config/database');
const { extractPlainText } = require('../utils/editorjs');

async function createDocument({ navigation_item_id, title, content = '' }) {
  const content_plain = extractPlainText(content);

  const sql = `
    INSERT INTO documents (navigation_item_id, title, content, content_plain)
    VALUES (?, ?, ?, ?)
  `;
  const result = await query(sql, [
    navigation_item_id,
    title,
    typeof content === 'string' ? content : JSON.stringify(content),
    content_plain || null,
  ]);
  const [doc] = await query(`SELECT * FROM documents WHERE id = ?`, [result.insertId]);
  return doc;
}

async function updateDocument(id, payload) {
  const fields = [];
  const params = [];

  if (payload.title != null) {
    fields.push('title = ?');
    params.push(payload.title);
  }

  if (payload.content != null) {
    const serialized = typeof payload.content === 'string'
      ? payload.content
      : JSON.stringify(payload.content);
    fields.push('content = ?');
    params.push(serialized);

    // keep content_plain in sync
    fields.push('content_plain = ?');
    params.push(extractPlainText(serialized) || null);
  }

  if (!fields.length) return await getDocumentById(id);

  const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);
  await query(sql, params);

  return await getDocumentById(id);
}

async function getDocumentById(id) {
  const rows = await query(`SELECT * FROM documents WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function listDocumentsByNav(navigation_item_id) {
  return await query(
    `SELECT * FROM documents WHERE navigation_item_id = ? ORDER BY updated_at DESC`,
    [navigation_item_id]
  );
}

module.exports = {
  createDocument,
  updateDocument,
  getDocumentById,
  listDocumentsByNav,
};

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
