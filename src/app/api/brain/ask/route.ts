import { NextResponse } from "next/server";
import { resolveHeliaAuthContext } from "@/lib/auth/helia-session";
import { askBrainForUser } from "@/services/brain/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await resolveHeliaAuthContext(request.headers);
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
    const message =
      error instanceof Error ? error.message : "Failed to reach Helia Brain";
    return NextResponse.json(
      { ok: false, error: { message, code: "BRAIN_ASK_FAILED" } },
      { status: 502 }
    );
  }
}
