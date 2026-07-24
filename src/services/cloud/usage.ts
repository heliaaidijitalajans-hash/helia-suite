import { cloudRequest } from "./http";
import type { CloudPlan, CloudUsageResponse } from "./types";

export async function fetchUsage(
  organizationId?: string | null
): Promise<CloudUsageResponse> {
  const qs = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  return cloudRequest<CloudUsageResponse>(`/usage${qs}`);
}

export async function listPlans(): Promise<CloudPlan[]> {
  const data = await cloudRequest<{ ok: true; items: CloudPlan[] }>("/plans");
  return data.items;
}
