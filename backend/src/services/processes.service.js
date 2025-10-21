const { query } = require('../config/database');

async function listProcesses(navigation_item_id) {
  const rows = await query(
    `SELECT p.id, p.navigation_item_id, p.bpmn_xml, p.version, p.updated_at, u.full_name AS updated_by_name
     FROM processes p
     LEFT JOIN users u ON u.id = p.updated_by
     WHERE p.navigation_item_id = ?
     ORDER BY p.updated_at DESC`,
    [navigation_item_id]
  );
  return rows;
}

async function getProcess(id) {
  const rows = await query(
    `SELECT p.*, u.full_name AS updated_by_name
     FROM processes p
     LEFT JOIN users u ON u.id = p.updated_by
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createProcess({ navigation_item_id, bpmn_xml }, userId) {
  const result = await query(
    `INSERT INTO processes (navigation_item_id, bpmn_xml, version, updated_by)
     VALUES (?, ?, 1, ?)`,
    [navigation_item_id, bpmn_xml, userId]
  );
  return getProcess(result.insertId);
}

async function updateProcess(id, { bpmn_xml }, userId) {
  await query(
    `UPDATE processes
     SET bpmn_xml = ?, version = version + 1, updated_by = ?, updated_at = NOW()
     WHERE id = ?`,
    [bpmn_xml, userId, id]
  );
  return getProcess(id);
}

module.exports = { listProcesses, getProcess, createProcess, updateProcess };
