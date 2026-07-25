import { getHeliaAccessToken } from "@/lib/cloud/session";

type CloudErrorBody = {
  ok?: boolean;
  error?: { message?: string; code?: string };
};

export class HeliaCloudClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HeliaCloudClientError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Same-origin Helia Cloud API.
 * Sends credentials (cookie) always; adds Bearer when a client token exists.
 * Browser sessions work with cookie alone — no manual Authorization required.
 */
export async function cloudRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getHeliaAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path.startsWith("/api/") ? path : `/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | (T & CloudErrorBody)
    | null;

  if (!res.ok || data?.ok === false) {
    throw new HeliaCloudClientError(
      data?.error?.message || `Helia Cloud request failed (${res.status})`,
      res.status,
      data?.error?.code
    );
  }

  return data as T;
}
