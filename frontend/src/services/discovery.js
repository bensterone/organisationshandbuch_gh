import api from './api';

export async function fetchRelated({ q, limit = 10 }) {
  const res = await api.get('/api/discovery/related', { params: { q, limit } });
  return res.data;
}
