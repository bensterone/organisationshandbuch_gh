// backend/src/services/documents.service.js
const { query } = require('../config/database');
const { extractPlainText } = require('../utils/editorjs');

function serializeContent(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;

  try {
    return JSON.stringify(content);
  } catch (err) {
    return String(content);
  }
}

function normalizeContent(content) {
  const serialized = serializeContent(content);
  const plain = extractPlainText(serialized) || null;
  return { serialized, plain };
}

async function listDocuments(navigation_item_id) {
  return await query(
    `SELECT d.id, d.navigation_item_id, d.title, d.content, d.updated_at, u.full_name AS updated_by_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.updated_by
      WHERE d.navigation_item_id = ?
      ORDER BY d.updated_at DESC`,
    [navigation_item_id]
  );
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
  const { serialized, plain } = normalizeContent(content);

  const result = await query(
    `INSERT INTO documents (navigation_item_id, title, content, content_plain, updated_by)
     VALUES (?, ?, ?, ?, ?)`,
    [navigation_item_id, title, serialized, plain, userId ?? null]
  );

  return getDocument(result.insertId);
}

async function updateDocument(id, { title, content }, userId) {
  const sets = [];
  const params = [];

  if (title !== undefined) {
    sets.push('title = ?');
    params.push(title);
  }

  if (content !== undefined) {
    const { serialized, plain } = normalizeContent(content);
    sets.push('content = ?');
    params.push(serialized);
    sets.push('content_plain = ?');
    params.push(plain);
  }

  if (userId !== undefined) {
    sets.push('updated_by = ?');
    params.push(userId);
  }

  if (!sets.length) {
    return getDocument(id);
  }

  sets.push('updated_at = NOW()');
  const sql = `UPDATE documents SET ${sets.join(', ')} WHERE id = ?`;
  params.push(id);
  await query(sql, params);

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
