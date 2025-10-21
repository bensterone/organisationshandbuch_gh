import React from 'react';
import { downloadFile, deleteFile } from '../../services/files';
import Button from '../common/Button';

const FilesList = ({ files, onDeleted }) => {
  if (!files?.length) {
    return <p className="text-sm text-gray-600">No files uploaded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{f.title || f.original_filename}</p>
            <p className="text-xs text-gray-500 truncate">
              {f.mime_type} • {(f.file_size / 1024).toFixed(1)} KB{f.description ? ` • ${f.description}` : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => downloadFile(f.id)}>Download</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!confirm('Delete this file?')) return;
                try {
                  await deleteFile(f.id);
                  onDeleted?.();
                } catch (e) {
                  alert(e.response?.data?.error || 'Delete failed');
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilesList;
