import { jsonError, jsonOk, readJsonBody } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{ refreshToken?: string }>(request);
    const refreshToken =
      typeof body.refreshToken === "string" ? body.refreshToken : "";
    if (!refreshToken) throw new ValidationError("refreshToken is required");
    const tokens = await container.auth.refresh(refreshToken);
    return jsonOk({ tokens });
  } catch (error) {
    return jsonError(error);
  }
}
