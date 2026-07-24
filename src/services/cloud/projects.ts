import { cloudRequest } from "./http";
import type { CloudProject, ProjectEnvironment } from "./types";

export async function listProjects(
  organizationId?: string | null
): Promise<CloudProject[]> {
  const qs = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  const data = await cloudRequest<{ ok: true; items: CloudProject[] }>(
    `/api/projects${qs}`
  );
  return data.items;
}

export async function createProject(input: {
  organizationId: string;
  name: string;
  environment: ProjectEnvironment;
}): Promise<CloudProject> {
  const data = await cloudRequest<{ ok: true; project: CloudProject }>(
    "/api/projects",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return data.project;
}
