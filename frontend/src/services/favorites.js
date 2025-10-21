import api from './api';

export const toggleFavorite = async (navId) => {
  const { data } = await api.post('/api/favorites/toggle', { navigation_item_id: navId });
  return data?.favorited || false;
};

export const isFavorite = async (navId) => {
  const { data } = await api.get(`/api/favorites/is-favorite/${navId}`);
  return !!data?.isFavorite;
};

export const myFavorites = async () => {
  const { data } = await api.get('/api/favorites/me');
  return data || [];
};
