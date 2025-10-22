import api from "./api";

export async function listTags() {
  const { data } = await api.get("/tags");
  return data;
}

export async function listTagsForDocument(documentId) {
  const { data } = await api.get(`/tags/document/${documentId}`);
  return data;
}

export async function attachTag(document_id, tag_id) {
  const { data } = await api.post("/tags/attach", { document_id, tag_id });
  return data;
}

export async function detachTag(document_id, tag_id) {
  const { data } = await api.post("/tags/detach", { document_id, tag_id });
  return data;
}

/**
 * Set the *exact* set of tags for a document.
 * - Fetches current tags
 * - Attaches missing ones
 * - Detaches extra ones
 * Returns the updated tag list.
 */
export async function setTags(document_id, tagIds = []) {
  const current = await listTagsForDocument(document_id);
  const currentIds = new Set((current || []).map(t => t.id));
  const desiredIds = new Set(tagIds);

  const toAdd = [...desiredIds].filter(id => !currentIds.has(id));
  const toRemove = [...currentIds].filter(id => !desiredIds.has(id));

  await Promise.all([
    ...toAdd.map(id => attachTag(document_id, id)),
    ...toRemove.map(id => detachTag(document_id, id)),
  ]);

  return listTagsForDocument(document_id);
}

/* ---- Back-compat aliases ---- */
export const getTags = listTags;
export const getTagsForDocument = listTagsForDocument;
export const addTagToDocument = attachTag;
export const removeTagFromDocument = detachTag;
export const updateTags = setTags; // some code might use this name

export default {
  listTags,
  listTagsForDocument,
  attachTag,
  detachTag,
  setTags,
  // aliases
  getTags,
  getTagsForDocument,
  addTagToDocument,
  removeTagFromDocument,
  updateTags,
};
