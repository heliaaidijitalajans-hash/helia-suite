import {
  jsonError,
  jsonOk,
  omitSecretHash,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";
import { parseCreateApiKeyBody } from "@/lib/api-keys";

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
    const raw = await readJsonBody(request);

    let body;
    try {
      body = parseCreateApiKeyBody(raw);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : "Invalid API key payload"
      );
    }

    const created = await container.apiKeys.create({
      userId: user.id,
      projectId: body.projectId,
      name: body.name,
      ...(body.keyEnvironment ? { keyEnvironment: body.keyEnvironment } : {}),
      ...(body.expiresAt ? { expiresAt: body.expiresAt } : {}),
      ...(body.applicationType
        ? { applicationType: body.applicationType }
        : {}),
      ...(body.capabilities ? { capabilities: [...body.capabilities] } : {}),
      ...(body.permissions ? { permissions: [...body.permissions] } : {}),
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
