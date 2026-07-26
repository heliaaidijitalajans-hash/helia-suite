/**
 * POST /api/chat — public Helia AI chat for external apps (e.g. SnapSell).
 * Auth: Authorization: Bearer hl_live_* | hl_test_* (same as /api/apikeys/whoami).
 * No JWT. No admin session.
 */

import { NextResponse } from "next/server";
import { getBearerToken, readJsonBody } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { AppError, NotFoundError } from "@/server/helia/utils/errors";
import { runPublicApiChat } from "@/services/brain/public-api-chat";

export const runtime = "nodejs";

type ChatBody = {
  message?: unknown;
  conversationId?: unknown;
  metadata?: unknown;
};

function publicChatError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    let status = error.statusCode;
    let code = error.code;
    let message = error.message;

    // Auth / missing tenant context → opaque invalid key (no internal ids).
    if (
      error instanceof NotFoundError ||
      status === 401 ||
      code === "INVALID_API_KEY" ||
      code === "API_KEY_EXPIRED" ||
      code === "UNAUTHORIZED"
    ) {
      status = 401;
      code = "INVALID_API_KEY";
      message = "Invalid API key";
    } else if (status === 403 || code === "FORBIDDEN" || code === "ORG_SUSPENDED") {
      status = 403;
      code = "FORBIDDEN";
      message = "Forbidden";
    } else if (status === 429 || code.endsWith("_LIMIT")) {
      status = 429;
      code = "RATE_LIMITED";
      message = "Rate limited";
    } else if (status === 400 || code === "VALIDATION_ERROR") {
      status = 400;
      code = "VALIDATION_ERROR";
      message = error.message || "Invalid request";
    } else {
      status = 500;
      code = "INTERNAL_ERROR";
      message = "Internal error";
    }

    return NextResponse.json(
      { success: false, error: { code, message } },
      { status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal error" },
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const container = await getCloudContainer();
    const token = getBearerToken(request);
    if (!token) {
      throw new AppError("Invalid API key", {
        statusCode: 401,
        code: "INVALID_API_KEY",
      });
    }

    // Same validation path as GET /api/apikeys/whoami
    const ctx = await container.gateway.authenticateApiKey(token);

    const body = await readJsonBody<ChatBody>(request);
    const message = typeof body.message === "string" ? body.message : "";
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId : undefined;
    const metadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    const result = await runPublicApiChat(container, ctx, {
      message,
      ...(conversationId !== undefined ? { conversationId } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    });

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      reply: result.reply,
    });
  } catch (error) {
    return publicChatError(error);
  }
}
