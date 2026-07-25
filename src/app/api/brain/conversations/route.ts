import { NextResponse } from "next/server";
import { listScopedConversations } from "@/services/brain/server";
import {
  brainRouteErrorResponse,
  requireAdminBrainContext,
} from "@/services/brain/admin-gate";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminBrainContext(request);
    const items = await listScopedConversations(auth);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const { body, status } = brainRouteErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
