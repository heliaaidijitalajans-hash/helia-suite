import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireCloudUser,
} from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import type { PlanId } from "@/server/helia/cloud/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const items = await container.organizations.listForUser(user.id);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const body = await readJsonBody<{ name?: string; planId?: string }>(request);
    const name = typeof body.name === "string" ? body.name : "";
    const planId =
      typeof body.planId === "string" ? (body.planId as PlanId) : undefined;
    const result = await container.organizations.create({
      userId: user.id,
      name,
      ...(planId !== undefined ? { planId } : {}),
    });
    return jsonOk({ ...result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
