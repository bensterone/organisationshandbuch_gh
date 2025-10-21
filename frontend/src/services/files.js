import api from './api';

// List files, optionally by navigation item
export const listFiles = async (navigation_item_id) => {
  const res = await api.get('/api/files', {
    params: { navigation_item_id }
  });
  return res.data;
};

// Upload file for a navigation item
export const uploadFile = async ({ file, navigation_item_id, title, description }) => {
  const form = new FormData();
  form.append('file', file);
  if (navigation_item_id) form.append('navigation_item_id', navigation_item_id);
  if (title) form.append('title', title);
  if (description) form.append('description', description);

  const res = await api.post('/api/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data; // { id }
};

// Download by id (triggers browser download)
export const downloadFile = (id) => {
  window.location.href = `/api/files/${id}/download`;
};

// Delete file
export const deleteFile = async (id) => {
  await api.delete(`/api/files/${id}`);
};
