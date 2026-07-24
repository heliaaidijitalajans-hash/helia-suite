/**
 * Helia Cloud HTTP helpers (server-side).
 * Resolves authenticated user → organization → project → API key context.
 */

export type HeliaCloudUser = {
  id: string;
  email: string;
  displayName?: string;
};

export type HeliaCloudOrganization = {
  id: string;
  name: string;
  planId?: string;
};

export type HeliaCloudProject = {
  id: string;
  name: string;
  organizationId: string;
  environment?: string;
};

export type HeliaCloudMeResponse = {
  ok: true;
  user: HeliaCloudUser;
  organizations: HeliaCloudOrganization[];
  projects: HeliaCloudProject[];
};

export type HeliaCloudWhoAmI = {
  ok: true;
  organization: { id: string; name: string; planId: string };
  project: { id: string; name: string; environment: string };
  apiKey: {
    id: string;
    name: string;
    prefix: string;
    permissions: string[];
    usageCount: number;
  };
  plan: { id: string; name: string; limits: Record<string, unknown> };
  usage: Record<string, unknown>;
};

function cloudBaseUrl(): string {
  return (
    process.env.HELIA_CLOUD_URL?.replace(/\/$/, "") || "http://localhost:4091"
  );
}

async function cloudFetch<T>(
  path: string,
  init?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...rest } = init ?? {};
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(rest.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${cloudBaseUrl()}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: { message?: string } }
    | null;

  if (!res.ok || data?.ok === false) {
    const message =
      data?.error?.message || `Helia Cloud request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export function resolveCloudAccessToken(
  requestHeaders?: Headers
): string | null {
  const header = requestHeaders?.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token && !token.startsWith("hl_live_") && !token.startsWith("hl_test_")) {
      return token;
    }
  }

  const cookieHeader = requestHeaders?.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)helia_access_token=([^;]+)/);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return process.env.HELIA_CLOUD_ACCESS_TOKEN?.trim() || null;
}

export function resolveCloudApiKey(): string | null {
  return (
    process.env.HELIA_CLOUD_API_KEY?.trim() ||
    process.env.HELIA_PROJECT_API_KEY?.trim() ||
    null
  );
}

export async function fetchCloudMe(
  accessToken: string
): Promise<HeliaCloudMeResponse> {
  return cloudFetch<HeliaCloudMeResponse>("/me", { token: accessToken });
}

export async function fetchCloudWhoAmI(
  apiKey: string
): Promise<HeliaCloudWhoAmI> {
  return cloudFetch<HeliaCloudWhoAmI>("/v1/whoami", { token: apiKey });
}

export async function trackBrainUsage(apiKey: string): Promise<void> {
  await cloudFetch("/v1/track/brain_requests", {
    method: "POST",
    token: apiKey,
    body: JSON.stringify({}),
  });
}
