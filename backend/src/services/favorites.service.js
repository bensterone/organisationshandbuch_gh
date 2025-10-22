const { query } = require('../config/database');

async function listFavorites(userId) {
  return await query(
    `SELECT f.id, f.navigation_item_id, ni.title, ni.type, f.created_at
     FROM favorites f
     JOIN navigation_items ni ON ni.id = f.navigation_item_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
}

async function addFavorite(userId, navigation_item_id) {
  await query(`INSERT IGNORE INTO favorites (user_id, navigation_item_id) VALUES (?, ?)`, [userId, navigation_item_id]);
  return { success: true };
}

async function removeFavorite(userId, navigation_item_id) {
  await query(`DELETE FROM favorites WHERE user_id = ? AND navigation_item_id = ?`, [userId, navigation_item_id]);
  return { success: true };
}

module.exports = { listFavorites, addFavorite, removeFavorite };
