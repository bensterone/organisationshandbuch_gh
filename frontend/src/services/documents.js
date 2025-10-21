import api from './api';

// Get latest (or all) content blocks for a navigation item
export const getByNavigation = async (navigationItemId, { all = false } = {}) => {
  const res = await api.get(`/api/documents/by-navigation/${navigationItemId}`, {
    params: { all: all ? 'true' : undefined }
  });
  return res.data;
};

// Get a single content block by its content_block id
export const getDocument = async (id) => {
  const res = await api.get(`/api/documents/${id}`);
  return res.data;
};

// Create a new content version for a navigation item
export const createDocument = async ({ navigation_item_id, content, content_text }) => {
  const res = await api.post('/api/documents', {
    navigation_item_id,
    content,
    content_text
  });
  return res.data; // { id }
};

// Update an existing content block
export const updateDocument = async (id, { content, content_text }) => {
  await api.put(`/api/documents/${id}`, { content, content_text });
};

// Delete a content block
export const deleteDocument = async (id) => {
  await api.delete(`/api/documents/${id}`);
};
