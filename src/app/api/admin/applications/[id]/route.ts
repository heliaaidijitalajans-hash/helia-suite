import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    const body = await readJsonBody<{ enabled?: boolean }>(request);
    if (typeof body.enabled !== "boolean") {
      return jsonError(new Error("enabled boolean is required"));
    }
    const application = await container.admin.setApplicationEnabled(
      user.id,
      id,
      body.enabled
    );
    return jsonOk({ application });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    await container.admin.deleteApplication(user.id, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
