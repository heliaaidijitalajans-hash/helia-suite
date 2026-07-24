import { NextResponse } from "next/server";
import { resolveHeliaAuthContext } from "@/lib/auth/helia-session";
import { listScopedConversations } from "@/services/brain/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await resolveHeliaAuthContext(request.headers);
    const items = await listScopedConversations(auth);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load conversations";
    return NextResponse.json(
      { ok: false, error: { message, code: "CONVERSATIONS_LIST_FAILED" } },
      { status: 502 }
    );
  }
}
