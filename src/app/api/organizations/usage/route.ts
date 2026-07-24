import { jsonError, jsonOk, requireCloudUser } from "@/server/helia/http";

export const runtime = "nodejs";

/** Was GET /usage on Helia Cloud. */
export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") ?? undefined;

    if (organizationId) {
      await container.organizations.requireMembership(organizationId, user.id);
      const summary =
        await container.usage.summarizeOrganization(organizationId);
      const subscription = await container.subscriptions.getForOrganization(
        organizationId,
        user.id
      );
      return jsonOk({ subscription, ...summary });
    }

    const orgs = await container.organizations.listForUser(user.id);
    const summary = await container.usage.summarizeForUserOrgs(
      orgs.map((o) => o.id)
    );
    return jsonOk({ ...summary });
  } catch (error) {
    return jsonError(error);
  }
}
