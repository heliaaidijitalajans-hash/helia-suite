import { jsonError, readJsonBody } from "@/server/helia/http";
import { jsonOkWithAccessCookie } from "@/server/helia/auth-cookies";
import { getCloudContainer } from "@/server/helia/runtime";
import { toPublicUser } from "@/server/helia/cloud/utils";
import { AppError, ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const body = await readJsonBody<{ email?: string; password?: string }>(
      request
    );
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      throw new ValidationError("email and password are required");
    }

    const ua = request.headers.get("user-agent") || undefined;

    // Always (re)create admin from env before attempting login.
    await container.admin.ensureAdminCredentialsAccount();

    // Admin env match → skip DB password hash (avoids quote/hash drift).
    if (container.admin.matchesAdminEnvCredentials(email, password)) {
      const admin = await container.admin.ensureAdminCredentialsAccount();
      if (!admin) {
        throw new AppError(
          "Admin credentials are set but account could not be created",
          { statusCode: 500, code: "ADMIN_ENSURE_FAILED" }
        );
      }
      const result = await container.auth.loginAsUser(admin, {
        ...(ua ? { userAgent: ua } : {}),
      });
      if (!result.tokens?.accessToken) {
        throw new AppError("Login succeeded but no access token was issued", {
          statusCode: 500,
          code: "LOGIN_TOKEN_MISSING",
        });
      }
      return jsonOkWithAccessCookie(
        {
          user: toPublicUser(admin),
          tokens: result.tokens,
        },
        result.tokens.accessToken,
        { request }
      );
    }

    return await finishLogin(container, email, password, request, ua);
  } catch (error) {
    return jsonError(error);
  }
}

async function finishLogin(
  container: Awaited<ReturnType<typeof getCloudContainer>>,
  email: string,
  password: string,
  request: Request,
  userAgent?: string
) {
  const result = await container.auth.login({
    email,
    password,
    ...(userAgent ? { userAgent } : {}),
  });

  const ensured = await container.admin.ensureListedAdmin(result.user.id);
  if (!result.tokens?.accessToken) {
    throw new AppError("Login succeeded but no access token was issued", {
      statusCode: 500,
      code: "LOGIN_TOKEN_MISSING",
    });
  }

  return jsonOkWithAccessCookie(
    {
      user: toPublicUser(ensured),
      tokens: result.tokens,
    },
    result.tokens.accessToken,
    { request }
  );
}
