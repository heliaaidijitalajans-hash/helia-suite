import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import type { PlanId } from "@/server/helia/cloud/types";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

/** Was POST /subscriptions/change-plan on Helia Cloud. */
export async function POST(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const body = await readJsonBody<{
      organizationId?: string;
      planId?: string;
    }>(request);
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId : "";
    const planId =
      typeof body.planId === "string" ? (body.planId as PlanId) : "free";
    if (!organizationId) {
      throw new ValidationError("organizationId is required");
    }
    const subscription = await container.subscriptions.changePlan({
      userId: user.id,
      organizationId,
      planId,
    });
    return jsonOk({
      subscription,
      billing: {
        provider: "none",
        message:
          "Billing provider not connected. Plan change is architectural only.",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
