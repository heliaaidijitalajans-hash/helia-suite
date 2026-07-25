import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    const result = await container.admin.rotateApplicationKey(user.id, id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
