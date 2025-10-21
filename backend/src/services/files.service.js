const { query } = require('../config/database');

async function listFiles({ navigation_item_id } = {}) {
  let sql = `SELECT f.id, f.filename, f.original_name, f.mime_type, f.size, f.navigation_item_id,
                    f.created_at, u.full_name AS created_by_name
             FROM files f
             LEFT JOIN users u ON u.id = f.created_by`;
  const params = [];
  if (navigation_item_id) {
    sql += ` WHERE f.navigation_item_id = ?`;
    params.push(navigation_item_id);
  }
  sql += ` ORDER BY f.created_at DESC`;
  return await query(sql, params);
}

async function saveFileRecord({ filename, original_name, mime_type, size, navigation_item_id }, userId) {
  const result = await query(
    `INSERT INTO files (filename, original_name, mime_type, size, navigation_item_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [filename, original_name, mime_type, size, navigation_item_id || null, userId]
  );
  return result.insertId;
}

async function deleteFileRecord(id) {
  await query(`DELETE FROM files WHERE id = ?`, [id]);
  return { success: true };
}

module.exports = { listFiles, saveFileRecord, deleteFileRecord };
