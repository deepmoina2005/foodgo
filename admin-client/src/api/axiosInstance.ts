import axios from "axios";
import { store } from "../app/store";
import { logout } from "../features/auth/authSlice";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "string" && parsed.trim() ? parsed : trimmed;
  } catch {
    return trimmed;
  }
}

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = normalizeToken(store.getState().auth.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      store.dispatch(logout());
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
