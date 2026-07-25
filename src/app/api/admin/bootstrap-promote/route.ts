import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";

export const runtime = "nodejs";

/**
 * Promote the currently authenticated user to role=admin.
 * Requires HELIA_ADMIN_BOOTSTRAP_SECRET (min 16 chars) in env.
 * Does NOT require existing admin — used to unlock /admin safely.
 */
export async function POST(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const body = await readJsonBody<{ secret?: string }>(request);
    const promoted = await container.admin.promoteWithBootstrapSecret(
      user.id,
      typeof body.secret === "string" ? body.secret : ""
    );
    return jsonOk({
      user: promoted,
      message: "Account promoted to admin. Open /admin.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
