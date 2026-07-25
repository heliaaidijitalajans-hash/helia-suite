import { NextResponse } from "next/server";
import { askBrainForUser } from "@/services/brain/server";
import {
  brainRouteErrorResponse,
  requireAdminBrainContext,
} from "@/services/brain/admin-gate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminBrainContext(request);
    const body = (await request.json().catch(() => null)) as {
      content?: string;
      conversationId?: string | null;
      product?: "helia-suite" | "snapsell" | "crm" | "erp" | "mobile";
    } | null;

    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { ok: false, error: { message: "content is required", code: "VALIDATION" } },
        { status: 400 }
      );
    }

    const result = await askBrainForUser(auth, {
      content,
      conversationId:
        typeof body?.conversationId === "string" ? body.conversationId : null,
      product: body?.product,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const { body, status } = brainRouteErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
