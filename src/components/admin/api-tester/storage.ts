import type { HistoryEntry, HttpMethod } from "./types";
import { endpointKey } from "./types";
import type { AuthMode } from "./authHeaders";

const RECENT_KEY = "helia_admin_api_tester_recent_endpoints";
const HISTORY_KEY = "helia_admin_api_tester_history";
const AUTH_KEY = "helia_admin_api_tester_auth";

export type RecentEndpoint = {
  method: HttpMethod;
  path: string;
  at: string;
};

export type TesterAuthState = {
  apiKey: string;
  authMode: AuthMode;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function loadRecentEndpoints(): RecentEndpoint[] {
  return readJson<RecentEndpoint[]>(RECENT_KEY, []);
}

export function pushRecentEndpoint(method: HttpMethod, path: string) {
  const next: RecentEndpoint = {
    method,
    path,
    at: new Date().toISOString(),
  };
  const prev = loadRecentEndpoints().filter(
    (r) => endpointKey(r.method, r.path) !== endpointKey(method, path)
  );
  writeJson(RECENT_KEY, [next, ...prev].slice(0, 20));
}

export function loadHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []);
}

export function saveHistory(items: HistoryEntry[]) {
  writeJson(HISTORY_KEY, items.slice(0, 50));
}

/** Persist pasted API key for the browser tab (sessionStorage — not localStorage). */
export function loadTesterAuth(): TesterAuthState {
  if (typeof window === "undefined") {
    return { apiKey: "", authMode: "both" };
  }
  try {
    const raw = window.sessionStorage.getItem(AUTH_KEY);
    if (!raw) return { apiKey: "", authMode: "both" };
    const parsed = JSON.parse(raw) as Partial<TesterAuthState>;
    const authMode =
      parsed.authMode === "bearer" ||
      parsed.authMode === "x-api-key" ||
      parsed.authMode === "both"
        ? parsed.authMode
        : "both";
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      authMode,
    };
  } catch {
    return { apiKey: "", authMode: "both" };
  }
}

export function saveTesterAuth(state: TesterAuthState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch {
    // ignore quota
  }
}
