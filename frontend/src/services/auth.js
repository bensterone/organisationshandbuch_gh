import api from "./api";

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data; // { user, token }
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}

export default { login, me };
