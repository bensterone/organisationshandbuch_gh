import api from './api';

export const trackRecent = async (navId) => {
  try {
    await api.post('/api/recents/track', { navigation_item_id: navId });
  } catch {}
};

export const myRecents = async () => {
  const { data } = await api.get('/api/recents/me');
  return data || [];
};
