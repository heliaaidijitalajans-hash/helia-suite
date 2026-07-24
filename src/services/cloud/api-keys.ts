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
  projectId: string;
  name: string;
  keyEnvironment?: ApiKeyEnvironment;
  expiresAt?: string;
  applicationType?: string;
  capabilities?: string[];
  permissions?: string[];
}): Promise<{ apiKey: CloudApiKey; secret: string; warning?: string }> {
  // Always send backend enums — never UI labels.
  const applicationType =
    input.applicationType !== undefined
      ? toApplicationTypeEnum(input.applicationType)
      : undefined;

  return cloudRequest("/api/apikeys", {
    method: "POST",
    body: JSON.stringify({
      projectId: input.projectId,
      name: input.name,
      ...(input.keyEnvironment
        ? { keyEnvironment: input.keyEnvironment }
        : {}),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      ...(applicationType ? { applicationType } : {}),
      ...(input.capabilities ? { capabilities: input.capabilities } : {}),
      ...(input.permissions ? { permissions: input.permissions } : {}),
    }),
  });
}

export async function rotateApiKey(
  apiKeyId: string
): Promise<{ apiKey: CloudApiKey; secret: string; warning?: string }> {
  return cloudRequest(`/api/apikeys/${encodeURIComponent(apiKeyId)}/rotate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
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
