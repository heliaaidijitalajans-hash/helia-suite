import { toApplicationTypeEnum } from "@/lib/api-keys";
import { cloudRequest } from "./http";
import type { ApiKeyEnvironment, CloudApiKey } from "./types";

export async function listApiKeys(
  projectId?: string | null
): Promise<CloudApiKey[]> {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  const data = await cloudRequest<{ ok: true; items: CloudApiKey[] }>(
    `/api/apikeys${qs}`
  );
  return data.items;
}

export async function createApiKey(input: {
  /** Optional — backend provisions a default workspace when omitted. */
  projectId?: string;
  name: string;
  keyEnvironment?: ApiKeyEnvironment;
  expiresAt?: string;
  applicationType?: string;
  capabilities?: string[];
  permissions?: string[];
}): Promise<{ apiKey: CloudApiKey; secret: string; warning?: string }> {
  const applicationType =
    input.applicationType !== undefined
      ? toApplicationTypeEnum(input.applicationType)
      : undefined;

  const data = await cloudRequest<{
    ok: true;
    apiKey: CloudApiKey;
    secret: string;
    warning?: string;
  }>("/api/apikeys", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.keyEnvironment
        ? { keyEnvironment: input.keyEnvironment }
        : {}),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      ...(applicationType ? { applicationType } : {}),
      ...(input.capabilities ? { capabilities: input.capabilities } : {}),
      ...(input.permissions ? { permissions: input.permissions } : {}),
    }),
  });

  if (!data.apiKey || !data.secret) {
    throw new Error("API key create response missing apiKey or secret");
  }

  return {
    apiKey: data.apiKey,
    secret: data.secret,
    warning: data.warning,
  };
}

export async function rotateApiKey(
  apiKeyId: string
): Promise<{ apiKey: CloudApiKey; secret: string; warning?: string }> {
  const data = await cloudRequest<{
    ok: true;
    apiKey: CloudApiKey;
    secret: string;
    warning?: string;
  }>(`/api/apikeys/${encodeURIComponent(apiKeyId)}/rotate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    apiKey: data.apiKey,
    secret: data.secret,
    warning: data.warning,
  };
}

export async function disableApiKey(apiKeyId: string): Promise<CloudApiKey> {
  const data = await cloudRequest<{ ok: true; apiKey: CloudApiKey }>(
    `/api/apikeys/${encodeURIComponent(apiKeyId)}/disable`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return data.apiKey;
}

export async function deleteApiKey(apiKeyId: string): Promise<void> {
  await cloudRequest(`/api/apikeys/${encodeURIComponent(apiKeyId)}`, {
    method: "DELETE",
  });
}

/** Validate a key via GET /api/apikeys/whoami (Bearer API key). */
export async function whoamiWithApiKey(apiKeySecret: string): Promise<{
  organization: { id: string; name: string; planId: string };
  project: { id: string; name: string; environment: string };
  apiKey: {
    id: string;
    name: string;
    prefix: string;
    permissions: string[];
    usageCount: number;
  };
}> {
  const res = await fetch("/api/apikeys/whoami", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKeySecret}`,
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as
    | {
        ok?: boolean;
        organization?: {
          id: string;
          name: string;
          planId: string;
        };
        project?: { id: string; name: string; environment: string };
        apiKey?: {
          id: string;
          name: string;
          prefix: string;
          permissions: string[];
          usageCount: number;
        };
        error?: { message?: string };
      }
    | null;

  if (!res.ok || !data?.ok || !data.organization || !data.project || !data.apiKey) {
    throw new Error(
      data?.error?.message || `whoami failed (${res.status})`
    );
  }

  return {
    organization: data.organization,
    project: data.project,
    apiKey: data.apiKey,
  };
}
