/**
 * Axios instance wired to the Django REST API, with JWT attach +
 * automatic refresh on 401. Tokens are kept in sessionStorage (cleared
 * when the tab closes), matching the previous mock-auth behaviour of
 * not persisting the session across browser restarts.
 */
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const ACCESS_KEY = "egmao_access";
export const REFRESH_KEY = "egmao_refresh";

export const tokenStore = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => sessionStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    sessionStorage.setItem(ACCESS_KEY, access);
    if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried && tokenStore.getRefresh()) {
      config._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/accounts/auth/refresh/`, { refresh: tokenStore.getRefresh() })
            .then((r) => {
              tokenStore.set(r.data.access, r.data.refresh);
              return r.data.access;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newAccess = await refreshPromise;
        config.headers.Authorization = `Bearer ${newAccess}`;
        return http(config);
      } catch {
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

/** DRF pagination unwrapping: {count, next, previous, results} -> results, or pass through arrays. */
export function unwrap(data) {
  if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
  return data;
}

/** Builds a multipart FormData body when any value is a File/Blob, else returns the plain object. */
export function toRequestBody(payload) {
  const hasFile = Object.values(payload).some((v) => v instanceof File || v instanceof Blob);
  if (!hasFile) return { data: payload, isMultipart: false };
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value);
  });
  return { data: form, isMultipart: true };
}

export default http;
