import { cloudRequest } from "./http";
import type { CloudOrganization, PlanId } from "./types";

export async function listOrganizations(): Promise<CloudOrganization[]> {
  const data = await cloudRequest<{ ok: true; items: CloudOrganization[] }>(
    "/organizations"
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
  }>("/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.organization;
}

/**
 * Helia Cloud’s supported organization mutation today is plan change.
 * Name rename / delete are not exposed by the Cloud dashboard API yet.
 */
export async function changeOrganizationPlan(input: {
  organizationId: string;
  planId: PlanId;
}): Promise<void> {
  await cloudRequest("/subscriptions/change-plan", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
