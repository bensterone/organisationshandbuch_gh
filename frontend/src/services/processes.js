import api from './api';

// Create a new process page
export const createProcess = async ({ parent_id, title, description }) => {
  const res = await api.post('/api/processes', { parent_id, title, description });
  return res.data; // { navigation_item_id }
};
