import axios from 'axios';
import env from '../config/env';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem(env.TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem(env.TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;