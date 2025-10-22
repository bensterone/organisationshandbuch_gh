import api from "./api";

export async function globalSearch(q, limit = 20) {
  const { data } = await api.get("/search", { params: { q, limit } });
  return data; // { q, navItems, documents, processes }
}

export default { globalSearch };
