import { NextResponse } from "next/server";
import {
  deleteScopedConversation,
  getScopedConversation,
  renameScopedConversation,
} from "@/services/brain/server";
import { clearBrainConversation } from "@/lib/api/brain";
import {
  brainRouteErrorResponse,
  requireAdminBrainContext,
} from "@/services/brain/admin-gate";

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

    const auth = await requireAdminBrainContext(request);
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
    const { body, status } = brainRouteErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: { message: "id required", code: "VALIDATION" } },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      title?: string;
    } | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "title is required", code: "VALIDATION" },
        },
        { status: 400 }
      );
    }

    const auth = await requireAdminBrainContext(request);
    const conversation = await renameScopedConversation(auth, id, title);
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
      conversation: {
        id: conversation.id,
        title: conversation.title,
        preview: conversation.preview,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    const { body, status } = brainRouteErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: { message: "id required", code: "VALIDATION" } },
        { status: 400 }
      );
    }

    const auth = await requireAdminBrainContext(request);
    const deleted = await deleteScopedConversation(auth, id);
    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Conversation not found", code: "NOT_FOUND" },
        },
        { status: 404 }
      );
    }

    try {
      await clearBrainConversation(id);
    } catch {
      // Persistence delete is source of truth; in-memory clear is best-effort.
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    const { body, status } = brainRouteErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
