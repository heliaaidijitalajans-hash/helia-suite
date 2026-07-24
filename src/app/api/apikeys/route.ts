import {
  jsonError,
  jsonOk,
  omitSecretHash,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";
import { parseCreateApiKeyBody } from "@/lib/api-keys";
import { ensureDefaultWorkspace } from "@/server/helia/cloud/services/workspaceBootstrap";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const projectIdParam = new URL(request.url).searchParams.get("projectId");

    if (projectIdParam) {
      const items = await container.apiKeys.listForProject(
        projectIdParam,
        user.id
      );
      return jsonOk({ items: items.map(omitSecretHash) });
    }

    // Ensure workspace exists so the dashboard never depends on a manual project.
    await ensureDefaultWorkspace(container, user.id);
    const items = await container.apiKeys.listForUser(user.id);
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

    let projectId = body.projectId;
    if (projectId) {
      const existing = await container.db.projects.findById(projectId);
      if (!existing) {
        projectId = undefined;
      } else {
        try {
          await container.organizations.requireMembership(
            existing.organizationId,
            user.id
          );
        } catch {
          projectId = undefined;
        }
      }
    }

    if (!projectId) {
      const workspace = await ensureDefaultWorkspace(container, user.id);
      projectId = workspace.project.id;
    }

    const created = await container.apiKeys.create({
      userId: user.id,
      projectId,
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
