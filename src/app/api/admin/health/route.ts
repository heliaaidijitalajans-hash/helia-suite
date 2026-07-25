import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const health = await container.admin.getHealth();
    return jsonOk({ health });
  } catch (error) {
    return jsonError(error);
  }
}
