const { query } = require('../config/database');

async function getDiscoveryForUser(userId) {
  const [user] = await query(`SELECT id, username, full_name, role FROM users WHERE id = ? LIMIT 1`, [userId]);

  const acknowledgements = await query(
    `SELECT id, title, acknowledged_at
     FROM acknowledgements
     WHERE user_id = ?
     ORDER BY acknowledged_at DESC
     LIMIT 50`,
    [userId]
  );

  const approvals = await query(
    `SELECT id, title, status, decided_at
     FROM approvals
     WHERE user_id = ?
     ORDER BY decided_at DESC
     LIMIT 50`,
    [userId]
  );

  return { user: user || null, acknowledgements, approvals };
}

module.exports = { getDiscoveryForUser };
