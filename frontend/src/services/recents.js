// frontend/src/services/recents.js
import api from "./api";

/**
 * Get the user's recent items (documents/processes, etc.)
 */
export async function listRecents() {
  const { data } = await api.get("/recents");
  return data;
}

/**
 * Track a visit to an entity (document/process).
 * entity_type: "document" | "process" (or whatever your backend expects)
 * entity_id: number
 */
export async function trackVisit(entity_type, entity_id) {
  const { data } = await api.post("/recents/track", { entity_type, entity_id });
  return data;
}

// Back-compat alias some components still import
export const trackRecent = trackVisit;

/**
 * Optional: add a recent explicitly (payload shape depends on your API)
 */
export async function addRecent(payload) {
  const { data } = await api.post("/recents", payload);
  return data;
}

const RecentsService = {
  listRecents,
  trackVisit,
  trackRecent,
  addRecent,
};
export default RecentsService;
