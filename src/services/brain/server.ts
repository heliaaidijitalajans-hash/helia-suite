/**
 * Helia Brain orchestration (server).
 * Flow: admin auth → usage metering → embedded Brain ask → Cloud-persisted chat.
 */

import { askBrain } from "@/lib/api/brain";
import { trackBrainUsageInProcess } from "@/lib/api/helia-cloud";
import type { HeliaAuthContext } from "@/lib/auth/helia-session";
import { getCloudContainer } from "@/server/helia/runtime";
import {
  createLocalId,
  titleFromContent,
  toAssistantMessage,
  toUserMessage,
} from "./format";
import type {
  AskBrainServiceInput,
  AskBrainServiceResult,
  PersistedConversation,
} from "./types";

export async function listScopedConversations(auth: HeliaAuthContext) {
  const container = await getCloudContainer();
  return container.brainChat.listForUser(auth.user.id);
}

export async function getScopedConversation(
  auth: HeliaAuthContext,
  conversationId: string
): Promise<PersistedConversation | null> {
  const container = await getCloudContainer();
  const found = await container.brainChat.getForUser(
    auth.user.id,
    conversationId
  );
  if (!found) return null;
  return {
    id: found.id,
    organizationId: found.organizationId,
    projectId: found.projectId,
    userId: found.userId,
    title: found.title,
    preview: found.preview,
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
    messages: found.messages,
    product: found.product,
  };
}

export async function deleteScopedConversation(
  auth: HeliaAuthContext,
  conversationId: string
): Promise<boolean> {
  const container = await getCloudContainer();
  return container.brainChat.delete(auth.user.id, conversationId);
}

export async function renameScopedConversation(
  auth: HeliaAuthContext,
  conversationId: string,
  title: string
): Promise<PersistedConversation | null> {
  const container = await getCloudContainer();
  const updated = await container.brainChat.rename(
    auth.user.id,
    conversationId,
    title
  );
  if (!updated) return null;
  const full = await container.brainChat.getForUser(auth.user.id, updated.id);
  if (!full) return null;
  return {
    id: full.id,
    organizationId: full.organizationId,
    projectId: full.projectId,
    userId: full.userId,
    title: full.title,
    preview: full.preview,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
    messages: full.messages,
    product: full.product,
  };
}

export async function askBrainForUser(
  auth: HeliaAuthContext,
  input: AskBrainServiceInput
): Promise<AskBrainServiceResult> {
  const container = await getCloudContainer();
  const userMessage = toUserMessage(input.content);

  const existing = input.conversationId
    ? await container.brainChat.getForUser(auth.user.id, input.conversationId)
    : null;

  const conversationId = existing?.id || createLocalId("conv");

  try {
    await trackBrainUsageInProcess({
      organizationId: auth.organization.id,
      projectId: auth.project.id,
    });
  } catch {
    // Usage tracking must not block the ask.
  }

  const brain = await askBrain({
    text: input.content,
    conversationId,
    adminId: auth.user.id,
    recentMessages: (existing?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const assistantMessage = toAssistantMessage(brain.answer);

  const saved = await container.brainChat.appendMessages({
    userId: auth.user.id,
    conversationId,
    organizationId: auth.organization.id,
    projectId: auth.project.id,
    titleIfNew: titleFromContent(input.content),
    product: input.product ?? "helia-suite",
    userContent: userMessage.content,
    assistantContent: assistantMessage.content,
  });

  const conversation: PersistedConversation = {
    id: saved.id,
    organizationId: saved.organizationId,
    projectId: saved.projectId,
    userId: saved.userId,
    title: saved.title,
    preview: saved.preview,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
    messages: saved.messages,
    product: saved.product,
  };

  return { conversation, userMessage, assistantMessage };
}
