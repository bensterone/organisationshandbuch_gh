import React, { useState } from 'react';
import Button from '../common/Button';
import { createProcess } from '../../services/processes';
import { useNavigationStore } from '../../stores/navigationStore';

const NewProcessButton = () => {
  const { setItems } = useNavigationStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createProcess({ title, description: desc });
      // refresh tree
      const res = await fetch('/api/navigation');
      const items = await res.json();
      setItems(items);
      setOpen(false);
      setTitle('');
      setDesc('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {!open ? (
        <Button onClick={() => setOpen(true)}>+ New Process</Button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-3 mt-2 space-y-2">
          <input
            type="text"
            placeholder="Process title"
            className="w-full border rounded px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            className="w-full border rounded px-2 py-1"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={loading}>Create</Button>
            <Button variant="secondary" onClick={() => setOpen(false)} type="button">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewProcessButton;
