import { cloudRequest } from "./http";
import type { CloudPlan, CloudUsageResponse } from "./types";

export async function fetchUsage(
  organizationId?: string | null
): Promise<CloudUsageResponse> {
  const qs = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  return cloudRequest<CloudUsageResponse>(`/api/organizations/usage${qs}`);
}

export async function listPlans(): Promise<CloudPlan[]> {
  const data = await cloudRequest<{ ok: true; items: CloudPlan[] }>(
    "/api/organizations/plans"
  );
  return data.items;
}
