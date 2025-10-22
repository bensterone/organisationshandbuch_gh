import api from "./api";

export async function listWikiLinksForItem(id) {
  const { data } = await api.get(`/wikilinks/${id}`);
  return data;
}

export async function createWikiLink(from_navigation_item_id, to_navigation_item_id) {
  const { data } = await api.post("/wikilinks", { from_navigation_item_id, to_navigation_item_id });
  return data;
}

export async function deleteWikiLink(from_navigation_item_id, to_navigation_item_id) {
  const { data } = await api.delete("/wikilinks", { data: { from_navigation_item_id, to_navigation_item_id } });
  return data;
}

export default { listWikiLinksForItem, createWikiLink, deleteWikiLink };
