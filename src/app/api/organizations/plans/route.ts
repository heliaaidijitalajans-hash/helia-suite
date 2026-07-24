import { jsonError, jsonOk } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";

export const runtime = "nodejs";

/** Was GET /plans on Helia Cloud. */
export async function GET() {
  try {
    const container = await getCloudContainer();
    return jsonOk({ items: container.subscriptions.listPlans() });
  } catch (error) {
    return jsonError(error);
  }
}
