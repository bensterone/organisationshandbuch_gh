import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getTags, setTags } from '../../services/tags';
import Button from '../common/Button';
import { useAuthStore } from '../../stores/authStore';

const TagEditor = ({ navId }) => {
  const [tags, setLocalTags] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const load = async () => setLocalTags(await getTags(navId));

  useEffect(() => { if (navId) load(); }, [navId]);

  const add = () => {
    const t = input.trim();
    if (!t) return;
    if (!tags.includes(t)) setLocalTags([...tags, t]);
    setInput('');
  };
  const remove = (t) => setLocalTags(tags.filter(x => x !== t));
  const save = async () => { await setTags(navId, tags); };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
          #{t}
          {canEdit && <button onClick={() => remove(t)} title="Remove"><X className="w-3 h-3" /></button>}
        </span>
      ))}
      {canEdit && (
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="Add tag"
            className="text-xs border rounded px-2 py-1"
          />
          <Button variant="secondary" onClick={add}>Add</Button>
          <Button onClick={save}>Save</Button>
        </div>
      )}
    </div>
  );
};

export default TagEditor;
