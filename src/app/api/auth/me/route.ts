import { jsonError, jsonOk, requireCloudUser } from "@/server/helia/http";

export const runtime = "nodejs";

/** Was GET /me on Helia Cloud dashboard. */
export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const organizations = await container.organizations.listForUser(user.id);
    const projects = await container.projects.listForUser(user.id);
    return jsonOk({
      user: await container.auth.getUser(user.id),
      organizations,
      projects,
    });
  } catch (error) {
    return jsonError(error);
  }
}
