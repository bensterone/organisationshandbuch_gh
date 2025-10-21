const { query } = require('../config/database');

async function suggestNavigationTitles(q) {
  const like = `%${q}%`;
  return await query(
    `SELECT id, title, type
     FROM navigation_items 
     WHERE LOWER(title) LIKE LOWER(?)
     ORDER BY title ASC
     LIMIT 10`,
    [like]
  );
}

async function resolveTitlesToNavIds(titles = []) {
  if (!titles.length) return {};
  const ors = titles.map(() => `(LOWER(title)=LOWER(?) OR BINARY title=?)`).join(' OR ');
  const params = titles.flatMap(t => [t, t]);
  const rows = await query(`SELECT id, title, type FROM navigation_items WHERE ${ors}`, params);
  const map = {};
  for (const r of rows) map[r.title] = { id: r.id, type: r.type };
  return map;
}

module.exports = { suggestNavigationTitles, resolveTitlesToNavIds };
