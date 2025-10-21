import api from './api';

// Fetch all links for a process
export const getLinks = async (processId) => {
  const res = await api.get(`/api/processes/${processId}/links`);
  return res.data;
};

// Add or update link
export const addLink = async (processId, link) => {
  const res = await api.post(`/api/processes/${processId}/links`, link);
  return res.data;
};

// Delete link
export const deleteLink = async (processId, linkId) => {
  await api.delete(`/api/processes/${processId}/links/${linkId}`);
};
