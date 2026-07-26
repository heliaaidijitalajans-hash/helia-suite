/**
 * Public project-API-key chat — reuses askBrain + BrainChatService.
 * No JWT. No second chat stack.
 */

import { askBrain } from "@/lib/api/brain";
import {
  hasCapability,
  hasPermission,
} from "@/lib/api-keys/catalog";
import type { ApiKeyAuthContext } from "@/server/helia/cloud/types";
import type { CloudContainer } from "@/server/helia/cloud/composition/container";
import { sanitizeAssistantOutput } from "@/server/helia/brain/orchestrator/sanitize";
import { ForbiddenError, ValidationError } from "@/server/helia/utils/errors";
import { createId } from "@/server/helia/utils/id";
import {
  titleFromContent,
  toAssistantMessage,
  toUserMessage,
} from "./format";

const PRODUCT_VALUES = [
  "helia-suite",
  "snapsell",
  "crm",
  "erp",
  "mobile",
] as const;

type Product = (typeof PRODUCT_VALUES)[number];

export type PublicChatInput = {
  message: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
};

export type PublicChatResult = {
  conversationId: string;
  reply: string;
};

function assertChatAccess(ctx: ApiKeyAuthContext): void {
  const { permissions, capabilities } = ctx.apiKey;
  const canRun =
    hasPermission(permissions, "execute") ||
    hasPermission(permissions, "write") ||
    hasPermission(permissions, "admin");
  if (!canRun) {
    throw new ForbiddenError("API key lacks chat permission");
  }
  const caps = capabilities ?? [];
  // Legacy keys with no capability ACL: execute/write/admin is enough.
  // When capabilities are set, require chat or brain.
  const canChat =
    caps.length === 0
      ? true
      : hasCapability(caps, "chat", permissions) ||
        hasCapability(caps, "brain", permissions);
  if (!canChat) {
    throw new ForbiddenError("API key lacks chat capability");
  }
}

function resolveProduct(metadata?: Record<string, unknown>): Product {
  const raw = metadata?.product;
  if (typeof raw === "string" && (PRODUCT_VALUES as readonly string[]).includes(raw)) {
    return raw as Product;
  }
  return "helia-suite";
}

/** Persistence owner for API-key chats (stable across keys in the org). */
function chatOwnerUserId(ctx: ApiKeyAuthContext): string {
  return ctx.organization.ownerUserId || ctx.apiKey.createdByUserId;
}

export async function runPublicApiChat(
  container: CloudContainer,
  ctx: ApiKeyAuthContext,
  input: PublicChatInput
): Promise<PublicChatResult> {
  assertChatAccess(ctx);

  const message = input.message.trim();
  if (!message) {
    throw new ValidationError("message is required");
  }

  const ownerUserId = chatOwnerUserId(ctx);
  if (!ownerUserId) {
    throw new ForbiddenError("Organization owner is missing");
  }

  const requestedId =
    typeof input.conversationId === "string"
      ? input.conversationId.trim()
      : "";

  let existing = requestedId
    ? await container.brainChat.getForUser(ownerUserId, requestedId)
    : null;

  if (requestedId && !existing) {
    throw new ForbiddenError("Conversation not found");
  }
  if (
    existing &&
    (existing.organizationId !== ctx.organization.id ||
      existing.projectId !== ctx.project.id)
  ) {
    throw new ForbiddenError("Conversation not found");
  }

  const conversationId = existing?.id || createId("conv");
  const product = resolveProduct(input.metadata);

  await container.gateway.trackRequest(ctx, "brain_requests");

  const brain = await askBrain({
    text: message,
    conversationId,
    adminId: ownerUserId,
    recentMessages: (existing?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const userMessage = toUserMessage(message);
  const assistantMessage = toAssistantMessage(brain.answer);
  assistantMessage.content = sanitizeAssistantOutput(assistantMessage.content);

  const saved = await container.brainChat.appendMessages({
    userId: ownerUserId,
    conversationId,
    organizationId: ctx.organization.id,
    projectId: ctx.project.id,
    titleIfNew: titleFromContent(message),
    product,
    userContent: userMessage.content,
    assistantContent: assistantMessage.content,
  });

  return {
    conversationId: saved.id,
    reply: assistantMessage.content,
  };
}
