import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

/**
 * Props:
 *  - text (string) Plain text (we stored from Editor.js)
 *  - className (string)
 *
 * This component:
 *  1) Finds [[Titles]]
 *  2) Resolves titles -> { id, type }
 *  3) Replaces with <a> links to /documents/:id or /processes/:id
 */
const RichTextRenderer = ({ text = '', className = '' }) => {
  const titles = useMemo(() => {
    const re = /\[\[([^[\]]{1,255})\]\]/g;
    const set = new Set();
    let m;
    while ((m = re.exec(text)) !== null) {
      const t = m[1].trim();
      if (t) set.add(t);
    }
    return Array.from(set);
  }, [text]);

  const [map, setMap] = useState({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (titles.length === 0) { setMap({}); return; }
      const qs = encodeURIComponent(titles.join(','));
      const res = await api.get(`/api/wikilinks/resolve?titles=${qs}`);
      if (!mounted) return;
      setMap(res.data || {});
    };
    load();
    return () => { mounted = false; };
  }, [titles]);

  // Escape HTML then convert [[Title]] => anchor
  const html = useMemo(() => {
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
    let out = esc(text).replace(/\n/g, '<br/>');
    if (titles.length) {
      titles.forEach((t) => {
        const info = map[t] || map[t] || Object.values(map).find(v => v.title?.toLowerCase() === t.toLowerCase());
        if (info?.id) {
          const href = info.type === 'process' ? `/processes/${info.id}` : `/documents/${info.id}`;
          const linkHtml = `<a href="${href}" class="text-primary-600 underline decoration-primary-300 hover:decoration-primary-600">${esc(t)}</a>`;
          // Replace all [[t]] (escaped pattern)
          const pat = new RegExp(`\\[\\[\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]\\]`, 'gi');
          out = out.replace(pat, linkHtml);
        }
      });
    }
    return out;
  }, [text, titles, map]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default RichTextRenderer;
