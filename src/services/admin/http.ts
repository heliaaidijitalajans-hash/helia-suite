import { getHeliaAccessToken } from "@/lib/cloud/session";

export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getHeliaAccessToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: { message?: string };
  } & T;

  if (!res.ok || data.ok === false) {
    throw new Error(data.error?.message || `Request failed (${res.status})`);
  }
  return data;
}
