// backend/src/services/search.service.js
const { query } = require('../config/database');

/**
 * Build a WHERE clause that ANDs tokens across title/content_plain.
 * tokens: ['foo', 'bar'] =>
 *   (title LIKE '%foo%' OR content_plain LIKE '%foo%') AND
 *   (title LIKE '%bar%' OR content_plain LIKE '%bar%')
 */
function buildTokenWhere(tokens) {
  const whereParts = [];
  const params = [];

  for (const t of tokens) {
    whereParts.push(`(
      d.title LIKE ? OR
      (d.content_plain IS NOT NULL AND d.content_plain <> '' AND d.content_plain LIKE ?)
    )`);
    params.push(`%${t}%`, `%${t}%`);
  }

  const where = whereParts.length ? whereParts.join(' AND ') : '1=1';
  return { where, params };
}

async function globalSearch(rawQ) {
  const q = (rawQ || '').trim();

  // 1) Exact ID search with prefix #, e.g. "#12"
  const idMatch = q.match(/^#(\d{1,10})$/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const docs = await query(
      `SELECT d.id, d.title, d.updated_at
         FROM documents d
        WHERE d.id = ?
        ORDER BY d.updated_at DESC
        LIMIT 25`,
      [id]
    );

    const procs = await query(
      `SELECT p.id, ni.title AS title, p.updated_at
         FROM processes p
         JOIN navigation_items ni ON ni.id = p.navigation_item_id
        WHERE p.id = ?
        ORDER BY p.updated_at DESC
        LIMIT 25`,
      [id]
    );

    return { navigation: [], documents: docs, processes: procs };
  }

  // 2) Too short? bail out (prevents massive false positives on 1-char)
  if (q.length < 2) {
    return { navigation: [], documents: [], processes: [] };
  }

  // 3) Tokenize (split on whitespace); AND all tokens
  const tokens = q.split(/\s+/).filter(Boolean);
  const { where, params } = buildTokenWhere(tokens);

  // Documents: search title + content_plain only
  const documents = await query(
    `SELECT d.id, d.title, d.updated_at
       FROM documents d
      WHERE ${where}
      ORDER BY d.updated_at DESC
      LIMIT 25`,
    params
  );

  // Processes: search by the process "title" via its navigation item title
  const processes = await query(
    `SELECT p.id, ni.title AS title, p.updated_at
       FROM processes p
       JOIN navigation_items ni ON ni.id = p.navigation_item_id
      WHERE ${tokens.map(() => `(ni.title LIKE ?)`).join(' AND ')}
      ORDER BY p.updated_at DESC
      LIMIT 25`,
    tokens.flatMap(t => [`%${t}%`])
  );

  // (Optional) If you want a separate "Navigation" section, enable this,
  // but usually documents+processes are enough:
  const navigation = await query(
    `SELECT ni.id, ni.title, ni.type
       FROM navigation_items ni
      WHERE ${tokens.map(() => `(ni.title LIKE ?)`).join(' AND ')}
      ORDER BY ni.title
      LIMIT 25`,
    tokens.flatMap(t => [`%${t}%`])
  );

  return { navigation, documents, processes };
}

module.exports = { globalSearch };
