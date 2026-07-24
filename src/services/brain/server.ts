/**
 * Helia Brain orchestration (server).
 * Flow: Cloud auth → project API key usage → Brain ask → persist.
 */

import { askBrain } from "@/lib/api/brain";
import { trackBrainUsage } from "@/lib/api/helia-cloud";
import type { HeliaAuthContext } from "@/lib/auth/helia-session";
import {
  createLocalId,
  titleFromContent,
  toAssistantMessage,
  toUserMessage,
} from "./format";
import {
  getPersistedConversation,
  listPersistedConversations,
  savePersistedConversation,
} from "./persistence";
import type {
  AskBrainServiceInput,
  AskBrainServiceResult,
  PersistedConversation,
} from "./types";

export async function listScopedConversations(auth: HeliaAuthContext) {
  const items = await listPersistedConversations({
    organizationId: auth.organization.id,
    projectId: auth.project.id,
    userId: auth.user.id,
  });

  return items.map((c) => ({
    id: c.id,
    title: c.title,
    preview: c.preview,
    updatedAt: c.updatedAt,
  }));
}

export async function getScopedConversation(
  auth: HeliaAuthContext,
  conversationId: string
): Promise<PersistedConversation | null> {
  return getPersistedConversation(
    {
      organizationId: auth.organization.id,
      projectId: auth.project.id,
      userId: auth.user.id,
    },
    conversationId
  );
}

export async function askBrainForUser(
  auth: HeliaAuthContext,
  input: AskBrainServiceInput
): Promise<AskBrainServiceResult> {
  const userMessage = toUserMessage(input.content);
  const existing = input.conversationId
    ? await getScopedConversation(auth, input.conversationId)
    : null;

  // Track usage against the project API key (never shown in the chat UI).
  try {
    await trackBrainUsage(auth.apiKey);
  } catch {
    // Usage tracking must not block the ask when Cloud metering is unavailable.
  }

  const brain = await askBrain({
    text: input.content,
    ...(input.conversationId
      ? { conversationId: input.conversationId }
      : {}),
    adminId: auth.user.id,
  });

  const assistantMessage = toAssistantMessage(brain.answer);
  const conversationId = brain.answer.conversationId || createLocalId("conv");
  const now = new Date().toISOString();

  const conversation: PersistedConversation = existing
    ? {
        ...existing,
        id: conversationId,
        preview: input.content,
        updatedAt: now,
        messages: [...existing.messages, userMessage, assistantMessage],
      }
    : {
        id: conversationId,
        organizationId: auth.organization.id,
        projectId: auth.project.id,
        userId: auth.user.id,
        title: titleFromContent(input.content),
        preview: input.content,
        createdAt: now,
        updatedAt: now,
        messages: [userMessage, assistantMessage],
        product: input.product ?? "helia-suite",
      };

  // If Brain assigned a new id after a local placeholder, keep messages.
  if (existing && existing.id !== conversationId) {
    conversation.messages = [...existing.messages, userMessage, assistantMessage];
  }

  await savePersistedConversation(conversation);

  return { conversation, userMessage, assistantMessage };
}
