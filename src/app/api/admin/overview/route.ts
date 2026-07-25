import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const overview = await container.admin.getOverview();
    return jsonOk({ overview });
  } catch (error) {
    return jsonError(error);
  }
}
