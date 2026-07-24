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

/** Same-origin Helia Cloud API (Next.js Route Handlers). */
export async function cloudRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getHeliaAccessToken();
  if (!token) {
    throw new HeliaCloudClientError(
      "Helia Cloud session missing. Please log in.",
      401,
      "NO_SESSION"
    );
  }

  const res = await fetch(path.startsWith("/api/") ? path : `/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
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
