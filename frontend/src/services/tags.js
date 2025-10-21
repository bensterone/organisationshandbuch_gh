import api from './api';

export const getTags = async (navId) => {
  const { data } = await api.get(`/api/tags/${navId}`);
  return data || [];
};

export const setTags = async (navId, tags) => {
  await api.put(`/api/tags/${navId}`, { tags });
};

export const getPopularTags = async () => {
  const { data } = await api.get('/api/tags');
  return data || [];
};
