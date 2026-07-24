import {
  jsonError,
  jsonOk,
  omitSecretHash,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const projectId = new URL(request.url).searchParams.get("projectId");
    const items = projectId
      ? await container.apiKeys.listForProject(projectId, user.id)
      : await container.apiKeys.listForUser(user.id);
    return jsonOk({ items: items.map(omitSecretHash) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const body = await readJsonBody<{
      projectId?: string;
      name?: string;
      keyEnvironment?: string;
      expiresAt?: string;
      applicationType?: string;
      capabilities?: string[];
      permissions?: string[];
    }>(request);
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const name = typeof body.name === "string" ? body.name : "";
    if (!projectId) throw new ValidationError("projectId is required");
    const created = await container.apiKeys.create({
      userId: user.id,
      projectId,
      name,
      ...(typeof body.keyEnvironment === "string"
        ? { keyEnvironment: body.keyEnvironment as "live" | "test" }
        : {}),
      ...(typeof body.expiresAt === "string"
        ? { expiresAt: body.expiresAt }
        : {}),
      ...(typeof body.applicationType === "string"
        ? { applicationType: body.applicationType }
        : {}),
      ...(Array.isArray(body.capabilities)
        ? { capabilities: body.capabilities.filter((c) => typeof c === "string") }
        : {}),
      ...(Array.isArray(body.permissions)
        ? { permissions: body.permissions.filter((p) => typeof p === "string") }
        : {}),
    });
    return jsonOk(
      {
        apiKey: omitSecretHash(created.record),
        secret: created.secret,
        warning: "Store this secret now. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
