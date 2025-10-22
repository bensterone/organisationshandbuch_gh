import api from "./api";

export async function listDocuments(navigation_item_id) {
  const { data } = await api.get("/documents", { params: { navigation_item_id } });
  return data;
}

export async function getDocument(id) {
  const { data } = await api.get(`/documents/${id}`);
  return data;
}

export async function createDocument(payload) {
  const { data } = await api.post("/documents", payload);
  return data;
}

export async function updateDocument(id, payload) {
  const { data } = await api.put(`/documents/${id}`, payload);
  return data;
}

export async function deleteDocument(id) {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
}

// Back-compat aliases some components still import
export const getDocumentsByNavigation = listDocuments;
export const getByNavigation = listDocuments;

const DocumentsService = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByNavigation,
  getByNavigation,
};
export default DocumentsService;
