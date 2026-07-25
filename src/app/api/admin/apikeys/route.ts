import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const apiKeys = await container.admin.listApiKeys({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return jsonOk({ apiKeys });
  } catch (error) {
    return jsonError(error);
  }
}
