/**
 * Helia Cloud session context for Suite ↔ Brain (in-process, Vercel-ready).
 */

import {
  fetchCloudMe,
  resolveCloudAccessToken,
  resolveCloudApiKey,
  type HeliaCloudOrganization,
  type HeliaCloudProject,
  type HeliaCloudUser,
} from "@/lib/api/helia-cloud";
import { getCloudContainer } from "@/server/helia/runtime";

export type HeliaAuthContext = {
  user: HeliaCloudUser;
  organization: HeliaCloudOrganization;
  project: HeliaCloudProject;
  /** Present when an API key is configured; otherwise empty (in-process path). */
  apiKey: string;
  accessToken: string;
};

async function ensureUserWorkspace(userId: string): Promise<{
  organization: HeliaCloudOrganization;
  project: HeliaCloudProject;
}> {
  const container = await getCloudContainer();
  let organizations = await container.organizations.listForUser(userId);
  if (organizations.length === 0) {
    const created = await container.organizations.create({
      userId,
      name: "My Workspace",
    });
    organizations = [created.organization];
  }

  const organization = organizations[0]!;
  let projects = await container.projects.listForOrganization(
    organization.id,
    userId
  );
  const HIDDEN_DEFAULT_PROJECT_NAME = "Default";
  let project =
    projects.find((p) => p.name === HIDDEN_DEFAULT_PROJECT_NAME) || projects[0];

  if (!project) {
    project = await container.projects.create({
      userId,
      organizationId: organization.id,
      name: HIDDEN_DEFAULT_PROJECT_NAME,
      environment: "development",
    });
  }

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      planId: organization.planId,
    },
    project: {
      id: project.id,
      name: project.name,
      organizationId: project.organizationId,
      environment: project.environment,
    },
  };
}

export async function resolveHeliaAuthContext(
  requestHeaders?: Headers
): Promise<HeliaAuthContext> {
  const accessToken = resolveCloudAccessToken(requestHeaders);
  if (!accessToken) {
    throw new Error("Helia Cloud session missing. Please log in.");
  }

  const me = await fetchCloudMe(accessToken);
  const apiKey = resolveCloudApiKey();

  const preferredOrgId = process.env.HELIA_CLOUD_ORGANIZATION_ID?.trim();
  const preferredProjectId = process.env.HELIA_CLOUD_PROJECT_ID?.trim();

  if (apiKey) {
    const container = await getCloudContainer();
    const ctx = await container.gateway.authenticateApiKey(apiKey);

    if (preferredOrgId && preferredOrgId !== ctx.organization.id) {
      throw new Error(
        "HELIA_CLOUD_ORGANIZATION_ID does not match the configured API key."
      );
    }
    if (preferredProjectId && preferredProjectId !== ctx.project.id) {
      throw new Error(
        "HELIA_CLOUD_PROJECT_ID does not match the configured API key."
      );
    }

    const memberProject = me.projects.find((p) => p.id === ctx.project.id);
    if (!memberProject) {
      throw new Error(
        "Authenticated user cannot access the project bound to HELIA_CLOUD_API_KEY."
      );
    }

    return {
      user: me.user,
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
        planId: ctx.organization.planId,
      },
      project: {
        id: ctx.project.id,
        name: ctx.project.name,
        organizationId: ctx.organization.id,
        environment: ctx.project.environment,
      },
      apiKey,
      accessToken,
    };
  }

  let organization =
    me.organizations.find((o) => o.id === preferredOrgId) ||
    me.organizations[0];
  let project =
    (organization &&
      (me.projects.find((p) => p.id === preferredProjectId) ||
        me.projects.find((p) => p.organizationId === organization!.id))) ||
    me.projects[0];

  if (!organization || !project) {
    const ensured = await ensureUserWorkspace(me.user.id);
    organization = ensured.organization;
    project = ensured.project;
  }

  return {
    user: me.user,
    organization: {
      id: organization.id,
      name: organization.name,
      planId: organization.planId,
    },
    project: {
      id: project.id,
      name: project.name,
      organizationId: project.organizationId,
      environment: project.environment,
    },
    apiKey: "",
    accessToken,
  };
}
