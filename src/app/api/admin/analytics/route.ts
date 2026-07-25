import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const analytics = await container.admin.getAnalytics();
    return jsonOk({ analytics });
  } catch (error) {
    return jsonError(error);
  }
}
