import api from './api';

export const globalSearch = async (q, limit = 20) => {
  const { data } = await api.get('/api/search', { params: { q, limit } });
  return data?.items || [];
};

export const searchByTag = async (tag, limit = 50) => {
  const { data } = await api.get('/api/search/by-tag', { params: { tag, limit } });
  return data || [];
};
