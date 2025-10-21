import React, { useState } from 'react';
import Button from '../common/Button';
import { uploadFile } from '../../services/files';

const FileUpload = ({ navigationItemId, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const disabled = !file || loading;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await uploadFile({
        file,
        navigation_item_id: navigationItemId,
        title: title || undefined,
        description: desc || undefined
      });
      setFile(null);
      setTitle('');
      setDesc('');
      onUploaded?.();
    } catch (e) {
      alert(e.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">Upload file</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
        />
      </div>
      <div className="mt-3">
        <Button onClick={handleUpload} disabled={disabled} loading={loading}>Upload</Button>
      </div>
    </div>
  );
};

export default FileUpload;
