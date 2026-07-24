/**
 * Hidden workspace bootstrap for API Keys / Helia Chat.
 * End users never create or manage Projects — a default project is
 * created or reused automatically when needed by the backend.
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

/** Internal-only project name — never shown as a user-facing Projects feature. */
export const HIDDEN_DEFAULT_PROJECT_NAME = "Default";

export type WorkspaceContext = {
  organization: CloudOrganization;
  project: CloudProject;
};

function pickDefaultProject(projects: CloudProject[]): CloudProject | undefined {
  return (
    projects.find((p) => p.name === HIDDEN_DEFAULT_PROJECT_NAME) || projects[0]
  );
}

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
  let project = pickDefaultProject(projects);

  if (!project) {
    project = await createProject({
      organizationId: organization.id,
      name: HIDDEN_DEFAULT_PROJECT_NAME,
      environment: "development",
    });
    projects = [project];
  }

  const storedProject = getActiveProjectId();
  if (storedProject && projects.some((p) => p.id === storedProject)) {
    project = projects.find((p) => p.id === storedProject) || project;
  }

  setActiveProjectId(project.id);
  return { organization, project };
}
