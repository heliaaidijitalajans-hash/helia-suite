import {
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{ email?: string; password?: string }>(
      request
    );
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      throw new ValidationError("email and password are required");
    }
    const result = await container.auth.login({
      email,
      password,
      ...(request.headers.get("user-agent")
        ? { userAgent: request.headers.get("user-agent")! }
        : {}),
    });
    return jsonOk({ ...result });
  } catch (error) {
    return jsonError(error);
  }
}
