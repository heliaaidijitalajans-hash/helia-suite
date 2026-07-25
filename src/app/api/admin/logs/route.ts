import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const logs = await container.audit.list({
      q: searchParams.get("q") ?? undefined,
      level: (searchParams.get("level") as "info" | "warning" | "error" | "all") || "all",
      category:
        (searchParams.get("category") as
          | "auth"
          | "api"
          | "request"
          | "application"
          | "admin"
          | "system"
          | "all") || "all",
      limit: Number(searchParams.get("limit") ?? 200) || 200,
    });
    return jsonOk({ logs });
  } catch (error) {
    return jsonError(error);
  }
}
