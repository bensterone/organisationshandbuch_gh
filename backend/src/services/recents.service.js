const { query } = require('../config/database');

async function listRecents(userId, limit = 20) {
  return await query(
    `SELECT r.navigation_item_id, ni.title, ni.type, MAX(r.visited_at) AS last_visited
     FROM recents r
     JOIN navigation_items ni ON ni.id = r.navigation_item_id
     WHERE r.user_id = ?
     GROUP BY r.navigation_item_id, ni.title, ni.type
     ORDER BY last_visited DESC
     LIMIT ?`,
    [userId, limit]
  );
}

async function trackVisit(userId, navigation_item_id) {
  await query(
    `INSERT INTO recents (user_id, navigation_item_id, visited_at)
     VALUES (?, ?, NOW())`,
    [userId, navigation_item_id]
  );
  return { success: true };
}

module.exports = { listRecents, trackVisit };
