import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import type { PlanId } from "@/server/helia/cloud/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { container } = await requireAdminUser(request);
    const { id } = await params;
    const organization = await container.admin.getOrganization(id);
    return jsonOk({ organization });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    const body = await readJsonBody<{
      name?: string;
      planId?: PlanId;
      status?: "active" | "suspended";
    }>(request);
    const organization = await container.admin.updateOrganization(
      user.id,
      id,
      body
    );
    return jsonOk({ organization });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    await container.admin.deleteOrganization(user.id, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
