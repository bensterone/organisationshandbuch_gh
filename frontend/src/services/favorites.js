import api from "./api";

/** List all favorites for the current user */
export async function listFavorites() {
  const { data } = await api.get("/favorites");
  return data; // [{ id, navigation_item_id, title, type, created_at }, ...]
}

/** Add a favorite */
export async function addFavorite(navigation_item_id) {
  const { data } = await api.post("/favorites", { navigation_item_id });
  return data; // { success: true }
}

/** Remove a favorite */
export async function removeFavorite(navigation_item_id) {
  const { data } = await api.delete("/favorites", { data: { navigation_item_id } });
  return data; // { success: true }
}

/** Check if a given nav item is favorited by the current user */
export async function isFavorite(navigation_item_id) {
  const favs = await listFavorites();
  return (favs || []).some(f => String(f.navigation_item_id) === String(navigation_item_id));
}

/** Convenience: toggle a favorite on/off; returns the new boolean state */
export async function toggleFavorite(navigation_item_id) {
  const currentlyFav = await isFavorite(navigation_item_id);
  if (currentlyFav) {
    await removeFavorite(navigation_item_id);
    return false;
  } else {
    await addFavorite(navigation_item_id);
    return true;
  }
}

/* Back-compat aliases (if older code uses these names) */
export const getFavorites = listFavorites;
export const addToFavorites = addFavorite;
export const removeFromFavorites = removeFavorite;

const FavoritesService = {
  listFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  toggleFavorite,
  // aliases...
};
export default FavoritesService;