const { query } = require('../config/database');

async function listPrivacyDocs() {
  return await query(
    `SELECT id, title, version, updated_at
     FROM privacy_documents
     ORDER BY updated_at DESC`,
    []
  );
}

module.exports = { listPrivacyDocs };
