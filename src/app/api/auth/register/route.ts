import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{
      email?: string;
      password?: string;
      displayName?: string;
    }>(request);
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName
        : email.split("@")[0] || "User";
    if (!email || !password) {
      throw new ValidationError("email and password are required");
    }
    const result = await container.auth.register({
      email,
      password,
      displayName,
    });
    return jsonOk({ ...result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
