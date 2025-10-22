// backend/src/utils/editorjs.js
function stripTags(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ');
}

function extractPlainText(editorData) {
  if (!editorData) return '';

  let data = editorData;
  if (typeof editorData === 'string') {
    try { data = JSON.parse(editorData); } catch { /* ignore */ }
  }

  const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
  const parts = [];

  for (const b of blocks) {
    const t = (b?.type || '').toLowerCase();
    const d = b?.data || {};

    if (t === 'paragraph' || t === 'header') {
      parts.push(stripTags(d.text || ''));
    } else if (t === 'list' && Array.isArray(d.items)) {
      parts.push(...d.items.map(stripTags));
    } else if (t === 'checklist' && Array.isArray(d.items)) {
      parts.push(...d.items.map(it => stripTags(it.text || '')));
    } else if (t === 'quote') {
      parts.push(stripTags(d.text || ''), stripTags(d.caption || ''));
    } else if (t === 'table' && Array.isArray(d.content)) {
      for (const row of d.content) parts.push(...row.map(stripTags));
    } else if (t === 'warning') {
      parts.push(stripTags(d.title || ''), stripTags(d.message || ''));
    } else if (t === 'raw') {
      parts.push(stripTags(d.html || ''));
    }
    // other blocks (image, code) are ignored for search plain text
  }

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 65535); // TEXT limit safety
}

module.exports = { extractPlainText };
