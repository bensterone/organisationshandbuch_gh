import api from './api';

/**
 * Standardized API wrapper for axios.
 * Returns { data, error } instead of throwing.
 */
export async function apiRequest(method, url, options = {}) {
  try {
    const res = await api({ method, url, ...options });
    return { data: res.data, error: null };
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Request failed';
    console.error('API Error:', msg);
    return { data: null, error: msg };
  }
}
