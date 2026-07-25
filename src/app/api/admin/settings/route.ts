import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const settings = await container.admin.getSettings();
    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { container, user } = await requireAdminUser(request);
    const body = await readJsonBody(request);
    const settings = await container.admin.updateSettings(user.id, body);
    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
