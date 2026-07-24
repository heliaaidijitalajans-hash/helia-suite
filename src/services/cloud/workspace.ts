/**
 * Ensure the signed-in user has at least one organization + project.
 * API Keys and Helia Chat depend on this workspace context.
 */

import {
  getActiveOrganizationId,
  getActiveProjectId,
  setActiveOrganizationId,
  setActiveProjectId,
} from "@/lib/cloud/active-context";
import { createOrganization, listOrganizations } from "./organizations";
import { createProject, listProjects } from "./projects";
import type { CloudOrganization, CloudProject } from "./types";

export type WorkspaceContext = {
  organization: CloudOrganization;
  project: CloudProject;
};

export async function ensureWorkspace(): Promise<WorkspaceContext> {
  let organizations = await listOrganizations();
  if (organizations.length === 0) {
    const created = await createOrganization({ name: "My Workspace" });
    organizations = [created];
  }

  const storedOrg = getActiveOrganizationId();
  const organization =
    organizations.find((o) => o.id === storedOrg) || organizations[0]!;
  setActiveOrganizationId(organization.id);

  let projects = await listProjects(organization.id);
  if (projects.length === 0) {
    const created = await createProject({
      organizationId: organization.id,
      name: "Default",
      environment: "development",
    });
    projects = [created];
  }

  const storedProject = getActiveProjectId();
  const project =
    (storedProject && projects.find((p) => p.id === storedProject)) ||
    projects.find((p) => p.organizationId === organization.id) ||
    projects[0]!;
  setActiveProjectId(project.id);

  return { organization, project };
}
