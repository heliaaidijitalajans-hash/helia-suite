/**
 * Hidden default org/project bootstrap for API Keys.
 * End users never manage these; the API provisions them as needed.
 */

import type { CloudContainer } from "../composition/container";
import type { Organization, Project } from "../types";

export const HIDDEN_DEFAULT_PROJECT_NAME = "Default";
export const HIDDEN_DEFAULT_ORG_NAME = "My Workspace";

export async function ensureDefaultWorkspace(
  container: CloudContainer,
  userId: string
): Promise<{ organization: Organization; project: Project }> {
  let organizations = await container.organizations.listForUser(userId);
  if (organizations.length === 0) {
    const created = await container.organizations.create({
      userId,
      name: HIDDEN_DEFAULT_ORG_NAME,
    });
    organizations = [created.organization];
  }

  const organization = organizations[0]!;
  await container.subscriptions.requireSubscription(organization.id);

  let projects = await container.projects.listForOrganization(
    organization.id,
    userId
  );
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

  return { organization, project };
}
