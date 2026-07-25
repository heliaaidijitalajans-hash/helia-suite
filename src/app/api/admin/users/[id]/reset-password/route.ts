import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { container, user } = await requireAdminUser(request);
    const { id } = await params;
    const body = await readJsonBody<{ password?: string }>(request);
    if (!body.password) throw new ValidationError("password is required");
    await container.admin.resetUserPassword(user.id, id, body.password);
    return jsonOk({ reset: true });
  } catch (error) {
    return jsonError(error);
  }
}
