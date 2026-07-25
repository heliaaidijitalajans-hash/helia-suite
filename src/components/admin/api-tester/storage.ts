import type { HistoryEntry, HttpMethod } from "./types";
import { endpointKey } from "./types";

const RECENT_KEY = "helia_admin_api_tester_recent_endpoints";
const HISTORY_KEY = "helia_admin_api_tester_history";

export type RecentEndpoint = {
  method: HttpMethod;
  path: string;
  at: string;
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
