/**
 * Legacy filesystem helpers — Admin Chat now persists via Cloud BrainChatService.
 * Kept as thin re-exports are unused; file retained only if external imports remain.
 */

import type { BrainScope, PersistedConversation } from "./types";

/** @deprecated Use Cloud BrainChatService via getCloudContainer().brainChat */
export async function listPersistedConversations(
  _scope: BrainScope
): Promise<PersistedConversation[]> {
  return [];
}

/** @deprecated Use Cloud BrainChatService via getCloudContainer().brainChat */
export async function getPersistedConversation(
  _scope: BrainScope,
  _conversationId: string
): Promise<PersistedConversation | null> {
  return null;
}

/** @deprecated Use Cloud BrainChatService via getCloudContainer().brainChat */
export async function savePersistedConversation(
  _conversation: PersistedConversation
): Promise<void> {
  // no-op — Cloud BrainChatService is the source of truth
}

/** @deprecated Use Cloud BrainChatService via getCloudContainer().brainChat */
export async function deletePersistedConversation(
  _scope: BrainScope,
  _conversationId: string
): Promise<boolean> {
  return false;
}

/** @deprecated Use Cloud BrainChatService via getCloudContainer().brainChat */
export async function renamePersistedConversation(
  _scope: BrainScope,
  _conversationId: string,
  _title: string
): Promise<PersistedConversation | null> {
  return null;
}
