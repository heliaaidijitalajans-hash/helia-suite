import { jsonError, jsonOk, readJsonBody } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{ refreshToken?: string }>(request);
    const refreshToken =
      typeof body.refreshToken === "string" ? body.refreshToken : "";
    if (refreshToken) await container.auth.logout(refreshToken);
    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
