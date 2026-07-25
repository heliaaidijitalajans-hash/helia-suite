import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";
import { parseCreateApiKeyBody } from "@/lib/api-keys";
import { ensureDefaultWorkspace } from "@/server/helia/cloud/services/workspaceBootstrap";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const apiKeys = await container.admin.listApiKeys({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return jsonOk({ apiKeys });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * Create an API key from the Admin Panel and persist it into the Helia Cloud
 * store with HMAC secretHash — same path whoami uses.
 */
export async function POST(request: Request) {
  try {
    const { container, user } = await requireAdminUser(request);
    const raw = await readJsonBody(request);

    let body;
    try {
      body = parseCreateApiKeyBody(raw);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : "Invalid API key payload"
      );
    }

    let organizationId: string | undefined;
    let projectId = body.projectId;

    if (projectId) {
      const project = await container.db.projects.findById(projectId);
      if (!project) {
        throw new ValidationError(`Project '${projectId}' not found`);
      }
      organizationId = project.organizationId;
    } else {
      const workspace = await ensureDefaultWorkspace(container, user.id);
      organizationId = workspace.organization.id;
      projectId = workspace.project.id;
    }

    const created = await container.admin.createApiKey(user.id, {
      organizationId,
      projectId,
      name: body.name,
      ...(body.keyEnvironment ? { keyEnvironment: body.keyEnvironment } : {}),
      ...(body.applicationType
        ? { applicationType: body.applicationType }
        : {}),
      ...(body.capabilities ? { capabilities: [...body.capabilities] } : {}),
      ...(body.permissions ? { permissions: [...body.permissions] } : {}),
    });

    return jsonOk(
      {
        apiKey: created.record,
        secret: created.secret,
        warning: "Store this secret now. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
