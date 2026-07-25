import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const organizations = await container.admin.listOrganizations({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return jsonOk({ organizations });
  } catch (error) {
    return jsonError(error);
  }
}
