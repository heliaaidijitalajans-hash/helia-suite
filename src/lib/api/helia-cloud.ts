/**
 * In-process Helia Cloud accessors for server modules (no HTTP / no localhost).
 */

import { getCloudContainer } from "@/server/helia/runtime";
import type { CloudUser } from "@/server/helia/cloud/types";

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
  const container = await getCloudContainer();
  const { user } = await container.auth.authenticateAccessToken(accessToken);
  const organizations = await container.organizations.listForUser(user.id);
  const projects = await container.projects.listForUser(user.id);
  const publicUser = await container.auth.getUser(user.id);
  return {
    ok: true,
    user: publicUser,
    organizations,
    projects,
  };
}

export async function trackBrainUsageInProcess(input: {
  organizationId: string;
  projectId: string;
}): Promise<void> {
  const container = await getCloudContainer();
  await container.usage.record({
    organizationId: input.organizationId,
    projectId: input.projectId,
    metric: "brain_requests",
  });
  await container.usage.record({
    organizationId: input.organizationId,
    projectId: input.projectId,
    metric: "requests",
  });
}

export async function resolveCloudUserFromToken(
  accessToken: string
): Promise<CloudUser> {
  const container = await getCloudContainer();
  const { user } = await container.auth.authenticateAccessToken(accessToken);
  return user;
}
