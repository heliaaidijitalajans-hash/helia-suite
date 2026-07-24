/**
 * Helia Cloud session context for Suite ↔ Brain.
 * Does not introduce a login UI — uses the authenticated Cloud session
 * (cookie / Authorization) or server env credentials.
 */

import {
  fetchCloudMe,
  fetchCloudWhoAmI,
  resolveCloudAccessToken,
  resolveCloudApiKey,
  type HeliaCloudOrganization,
  type HeliaCloudProject,
  type HeliaCloudUser,
} from "@/lib/api/helia-cloud";

export type HeliaAuthContext = {
  user: HeliaCloudUser;
  organization: HeliaCloudOrganization;
  project: HeliaCloudProject;
  /** Present server-side only; never expose to the browser. */
  apiKey: string;
  accessToken: string;
};

export async function resolveHeliaAuthContext(
  requestHeaders?: Headers
): Promise<HeliaAuthContext> {
  const accessToken = resolveCloudAccessToken(requestHeaders);
  const apiKey = resolveCloudApiKey();

  if (!accessToken) {
    throw new Error(
      "Helia Cloud session missing. Sign in or set HELIA_CLOUD_ACCESS_TOKEN."
    );
  }
  if (!apiKey) {
    throw new Error(
      "Helia project API key missing. Set HELIA_CLOUD_API_KEY on the server."
    );
  }

  const [me, whoami] = await Promise.all([
    fetchCloudMe(accessToken),
    fetchCloudWhoAmI(apiKey),
  ]);

  const preferredOrgId = process.env.HELIA_CLOUD_ORGANIZATION_ID?.trim();
  const preferredProjectId = process.env.HELIA_CLOUD_PROJECT_ID?.trim();

  // API key resolves the active project automatically (whoami).
  // Optional env overrides must still match that key's org/project.
  if (preferredOrgId && preferredOrgId !== whoami.organization.id) {
    throw new Error(
      "HELIA_CLOUD_ORGANIZATION_ID does not match the configured API key."
    );
  }
  if (preferredProjectId && preferredProjectId !== whoami.project.id) {
    throw new Error(
      "HELIA_CLOUD_PROJECT_ID does not match the configured API key."
    );
  }

  const memberProject = me.projects.find((p) => p.id === whoami.project.id);
  if (!memberProject) {
    throw new Error(
      "Authenticated user cannot access the project bound to HELIA_CLOUD_API_KEY."
    );
  }

  const organization: HeliaCloudOrganization = {
    id: whoami.organization.id,
    name: whoami.organization.name,
    planId: whoami.organization.planId,
  };

  const project: HeliaCloudProject = {
    id: whoami.project.id,
    name: whoami.project.name,
    organizationId: whoami.organization.id,
    environment: whoami.project.environment,
  };

  return {
    user: me.user,
    organization,
    project,
    apiKey,
    accessToken,
  };
}
