import { NextResponse } from "next/server";
import { resolveHeliaAuthContext } from "@/lib/auth/helia-session";
import { getScopedConversation } from "@/services/brain/server";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: { message: "id required", code: "VALIDATION" } },
        { status: 400 }
      );
    }

    const auth = await resolveHeliaAuthContext(request.headers);
    const conversation = await getScopedConversation(auth, id);
    if (!conversation) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Conversation not found", code: "NOT_FOUND" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      conversation,
      messages: conversation.messages,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load conversation";
    return NextResponse.json(
      { ok: false, error: { message, code: "CONVERSATION_GET_FAILED" } },
      { status: 502 }
    );
  }
}
