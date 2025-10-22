import api from "./api";

export async function listFiles(params = {}) {
  const { data } = await api.get("/files", { params });
  return data;
}

export async function uploadFile(formData) {
  const { data } = await api.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteFile(id) {
  const { data } = await api.delete(`/files/${id}`);
  return data;
}

/**
 * Download a file by id.
 * Returns { filename, blob }. You can create an object URL to trigger save.
 */
export async function downloadFile(id) {
  const res = await api.get(`/files/${id}/download`, { responseType: "blob" });
  // Try to extract a filename from Content-Disposition, fallback to id
  const cd = res.headers?.["content-disposition"] || res.headers?.get?.("content-disposition");
  let filename = `file-${id}`;
  if (cd) {
    const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
    if (m && m[1]) filename = m[1].replace(/^["']|["']$/g, "");
  }
  return { filename, blob: res.data };
}

/** Convenience: get a direct URL (if you prefer using a plain <a href>) */
export function getFileDownloadUrl(id) {
  return `${api.defaults.baseURL?.replace(/\/$/, "") || ""}/files/${id}/download`;
}

export default { listFiles, uploadFile, deleteFile, downloadFile, getFileDownloadUrl };
