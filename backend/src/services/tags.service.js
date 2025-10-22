const { query } = require('../config/database');

async function listTags() {
  return await query(`SELECT id, name, color FROM tags ORDER BY name ASC`, []);
}

async function listTagsForDocument(document_id) {
  return await query(
    `SELECT t.id, t.name, t.color
     FROM document_tags dt
     JOIN tags t ON t.id = dt.tag_id
     WHERE dt.document_id = ?`,
    [document_id]
  );
}

async function attachTag(document_id, tag_id) {
  await query(`INSERT IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)`, [document_id, tag_id]);
  return { success: true };
}

async function detachTag(document_id, tag_id) {
  await query(`DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?`, [document_id, tag_id]);
  return { success: true };
}

module.exports = { listTags, listTagsForDocument, attachTag, detachTag };
