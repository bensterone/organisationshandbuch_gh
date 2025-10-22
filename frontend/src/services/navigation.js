import api from "./api";

export async function getNavigationItem(id) {
  const { data } = await api.get(`/navigation/${id}`);
  return data;
}

export async function getChildren(id) {
  const { data } = await api.get(`/navigation/${id}/children`);
  return data;
}

export async function getBreadcrumbs(id) {
  const { data } = await api.get(`/navigation/${id}/breadcrumbs`);
  return data;
}

export async function createItem(payload) {
  const { data } = await api.post("/navigation", payload);
  return data;
}

export async function updateItem(id, patch) {
  const { data } = await api.patch(`/navigation/${id}`, patch);
  return data;
}

export async function deleteItem(id) {
  const { data } = await api.delete(`/navigation/${id}`);
  return data;
}

export default {
  getNavigationItem,
  getChildren,
  getBreadcrumbs,
  createItem,
  updateItem,
  deleteItem,
};
