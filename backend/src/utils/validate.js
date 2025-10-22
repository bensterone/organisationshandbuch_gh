/**
 * Minimal validation helpers without external deps.
 */
function requireFields(obj, fields = []) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || (typeof obj[f] === 'string' && obj[f].trim() === '')) {
      const err = new Error(`Missing required field: ${f}`);
      err.status = 400;
      throw err;
    }
  }
  return true;
}

function toInt(val, fallback = null) {
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toString(val, max = 500) {
  if (val == null) return '';
  const s = String(val);
  return s.length > max ? s.slice(0, max) : s;
}

module.exports = { requireFields, toInt, toString };
