import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import type { ProjectEnvironment } from "@/server/helia/cloud/types";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const organizationId = new URL(request.url).searchParams.get(
      "organizationId"
    );
    const items = organizationId
      ? await container.projects.listForOrganization(organizationId, user.id)
      : await container.projects.listForUser(user.id);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const body = await readJsonBody<{
      organizationId?: string;
      name?: string;
      environment?: string;
    }>(request);
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId : "";
    const name = typeof body.name === "string" ? body.name : "";
    const environment = (
      typeof body.environment === "string" ? body.environment : "development"
    ) as ProjectEnvironment;
    if (!organizationId) {
      throw new ValidationError("organizationId is required");
    }
    const project = await container.projects.create({
      userId: user.id,
      organizationId,
      name,
      environment,
    });
    return jsonOk({ project }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
