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
}): Promise<{ apiKey: CloudApiKey; secret: string; warning?: string }> {
  return cloudRequest("/api/apikeys", {
    method: "POST",
    body: JSON.stringify(input),
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
