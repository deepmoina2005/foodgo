import { createSlice } from "@reduxjs/toolkit";

const tokenKey = "foodgo_token";
const userKey = "foodgo_user";

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

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readTokenStorage(): string | null {
  if (typeof window === "undefined") return null;
  return normalizeToken(window.localStorage.getItem(tokenKey));
}

function writeTokenStorage(value: unknown) {
  if (typeof window === "undefined") return;
  const token = normalizeToken(value);
  if (!token) {
    window.localStorage.removeItem(tokenKey);
    return;
  }
  window.localStorage.setItem(tokenKey, token);
}

const initialState = {
  token: typeof window === "undefined" ? null : readTokenStorage(),
  user: readStorage<Record<string, unknown>>(userKey),
  status: "idle",
  error: null as string | null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state) {
      state.token = typeof window === "undefined" ? null : readTokenStorage();
      state.user = readStorage<Record<string, unknown>>(userKey);
    },
    setCredentials(state, action) {
      state.token = normalizeToken(action.payload.token);
      state.user = action.payload.user;
      writeTokenStorage(action.payload.token);
      writeStorage(userKey, action.payload.user);
    },
    setUser(state, action) {
      state.user = action.payload;
      writeStorage(userKey, action.payload);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      writeTokenStorage(null);
      writeStorage(userKey, null);
    },
    setAuthError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { hydrateAuth, setCredentials, setUser, logout, setAuthError } =
  authSlice.actions;
export default authSlice.reducer;
