import React, { useState } from 'react';
import EmojiPickerPopover from '../common/EmojiPickerPopover';
import Button from '../common/Button';
import api from '../../services/api';

const NewItemModal = ({ parentId = null, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('folder');
  const [icon, setIcon] = useState('📁');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/navigation', {
        parent_id: parentId,
        title,
        type,
        icon
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Create New {type === 'folder' ? 'Folder' : 'Document'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <EmojiPickerPopover onSelect={(emoji) => setIcon(emoji)}>
              <span className="text-2xl cursor-pointer">{icon}</span>
            </EmojiPickerPopover>
            <input
              type="text"
              className="flex-1 border rounded-lg p-2"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="type"
                value="folder"
                checked={type === 'folder'}
                onChange={() => setType('folder')}
              />
              Folder
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="type"
                value="document"
                checked={type === 'document'}
                onChange={() => setType('document')}
              />
              Document
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewItemModal;
