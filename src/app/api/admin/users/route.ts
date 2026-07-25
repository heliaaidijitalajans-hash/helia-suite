import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import type { PlatformRole } from "@/server/helia/cloud/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container } = await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const users = await container.admin.listUsers({
      q: searchParams.get("q") ?? undefined,
      role: (searchParams.get("role") as PlatformRole | "all") || "all",
      status:
        (searchParams.get("status") as "active" | "disabled" | "all") || "all",
    });
    return jsonOk({ users });
  } catch (error) {
    return jsonError(error);
  }
}
