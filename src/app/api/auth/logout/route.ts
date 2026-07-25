import { jsonError, jsonOk, readJsonBody } from "@/server/helia/http";
import { clearAccessTokenCookie } from "@/server/helia/auth-cookies";
import { getCloudContainer } from "@/server/helia/runtime";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{ refreshToken?: string }>(request);
    const refreshToken =
      typeof body.refreshToken === "string" ? body.refreshToken : "";
    if (refreshToken) await container.auth.logout(refreshToken);

    const response = NextResponse.json({ ok: true });
    return clearAccessTokenCookie(response);
  } catch (error) {
    return jsonError(error);
  }
}
