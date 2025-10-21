const { query } = require('../config/database');

async function listCompliance() {
  return await query(
    `SELECT id, title, category, updated_at
     FROM compliance_items
     ORDER BY category ASC, title ASC`,
    []
  );
}

module.exports = { listCompliance };
