import axios from "axios";
import env from "../config/env";

/**
 * Resolve API base URL in this order:
 * 1) env.API_BASE_URL   (your config/env override)
 * 2) REACT_APP_API_BASE_URL (e.g. http://127.0.0.1:8000/api for split-dev)
 * 3) "/api" (same-origin default for production)
 */
const resolvedBase =
  (env?.API_BASE_URL && String(env.API_BASE_URL)) ||
  (process.env.REACT_APP_API_BASE_URL && String(process.env.REACT_APP_API_BASE_URL)) ||
  "/api";

// strip trailing slashes just in case
const API_BASE = resolvedBase.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE,               // e.g. "http://127.0.0.1:8000/api" or "/api"
  timeout: 30000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Attach Authorization: Bearer <token> if present */
api.interceptors.request.use((config) => {
  const tokenKey = env?.TOKEN_KEY || "token";
  const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Global 401 handler -> logout + redirect to /login */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        const tokenKey = env?.TOKEN_KEY || "token";
        localStorage.removeItem(tokenKey);
      } catch {}
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- Dev helper: log failing request URLs (remove in prod) ---
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const url = err?.config?.baseURL
        ? err.config.baseURL.replace(/\/+$/, '') + '/' + String(err.config.url || '').replace(/^\/+/, '')
        : err?.config?.url;
      const status = err?.response?.status;
      if (status === 404) {
        // eslint-disable-next-line no-console
        console.error('[API 404]', url, err?.response?.data || '');
      }
    } catch {}
    return Promise.reject(err);
  }
);

export default api;
