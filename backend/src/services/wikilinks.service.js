const { query } = require('../config/database');

async function listWikiLinksForItem(id) {
  const outgoing = await query(
    `SELECT ni.id, ni.title, ni.type
     FROM wiki_links wl
     JOIN navigation_items ni ON ni.id = wl.to_navigation_item_id
     WHERE wl.from_navigation_item_id = ?
     ORDER BY ni.title ASC`,
    [id]
  );
  const incoming = await query(
    `SELECT ni.id, ni.title, ni.type
     FROM wiki_links wl
     JOIN navigation_items ni ON ni.id = wl.from_navigation_item_id
     WHERE wl.to_navigation_item_id = ?
     ORDER BY ni.title ASC`,
    [id]
  );
  return { outgoing, incoming };
}

async function createWikiLink(from_navigation_item_id, to_navigation_item_id) {
  await query(
    `INSERT IGNORE INTO wiki_links (from_navigation_item_id, to_navigation_item_id)
     VALUES (?, ?)`,
    [from_navigation_item_id, to_navigation_item_id]
  );
  return { success: true };
}

async function deleteWikiLink(from_navigation_item_id, to_navigation_item_id) {
  await query(
    `DELETE FROM wiki_links
     WHERE from_navigation_item_id = ? AND to_navigation_item_id = ?`,
    [from_navigation_item_id, to_navigation_item_id]
  );
  return { success: true };
}

module.exports = { listWikiLinksForItem, createWikiLink, deleteWikiLink };
