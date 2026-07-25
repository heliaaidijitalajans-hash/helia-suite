import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import type { PlatformRole } from "@/server/helia/cloud/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    const body = await readJsonBody<{
      displayName?: string;
      role?: PlatformRole;
      disabled?: boolean;
    }>(request);
    const updated = await container.admin.updateUser(user.id, id, body);
    return jsonOk({ user: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    await container.admin.deleteUser(user.id, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
