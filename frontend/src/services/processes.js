import api from "./api";

export async function listProcesses(navigation_item_id) {
  const { data } = await api.get("/processes", { params: { navigation_item_id } });
  return data;
}

export async function getProcess(id) {
  const { data } = await api.get(`/processes/${id}`);
  return data;
}

export async function createProcess(payload) {
  const { data } = await api.post("/processes", payload);
  return data;
}

export async function updateProcess(id, payload) {
  const { data } = await api.put(`/processes/${id}`, payload);
  return data;
}

export async function getProcessByNavigation(navId) {
  const { data } = await api.get(`/processes/by-navigation/${navId}`);
  return data;
}

const ProcessesService = {
  listProcesses,
  getProcess,
  createProcess,
  updateProcess,
  getProcessByNavigation,
};
export default ProcessesService;
