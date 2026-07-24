import { cloudRequest } from "./http";
import type { CloudOrganization, PlanId } from "./types";

export async function listOrganizations(): Promise<CloudOrganization[]> {
  const data = await cloudRequest<{ ok: true; items: CloudOrganization[] }>(
    "/api/organizations"
  );
  return data.items;
}

export async function createOrganization(input: {
  name: string;
  planId?: PlanId;
}): Promise<CloudOrganization> {
  const data = await cloudRequest<{
    ok: true;
    organization: CloudOrganization;
  }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.organization;
}

export async function changeOrganizationPlan(input: {
  organizationId: string;
  planId: PlanId;
}): Promise<void> {
  await cloudRequest("/api/organizations/subscriptions/change-plan", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
