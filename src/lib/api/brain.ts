/**
 * Helia Brain API — in-process (Vercel). No localhost / no :4090.
 */

export type {
  BrainAnswer,
  BrainAskRequestBody,
  BrainAskResult,
  BrainConversationSession,
  BrainConversationTurn,
  BrainEvidence,
  BrainStreamHandlers,
} from "./brain-types";

import type {
  BrainAskRequestBody,
  BrainAskResult,
  BrainConversationSession,
  BrainStreamHandlers,
} from "./brain-types";
import {
  askBrainEmbedded,
  clearBrainConversationEmbedded,
  getBrainConversationEmbedded,
  listBrainConversationsEmbedded,
} from "@/server/helia/brain/embedded";

export async function askBrain(
  body: BrainAskRequestBody,
  handlers: BrainStreamHandlers = {}
): Promise<BrainAskResult> {
  return askBrainEmbedded(body, handlers);
}

export async function listBrainConversations(
  limit = 50
): Promise<{ ok: true; items: BrainConversationSession[] }> {
  return listBrainConversationsEmbedded(limit);
}

export async function getBrainConversation(
  id: string
): Promise<{ ok: true; conversation: BrainConversationSession }> {
  const found = getBrainConversationEmbedded(id);
  if (!found) {
    throw new Error("Conversation not found");
  }
  return found;
}

export async function clearBrainConversation(
  id: string
): Promise<{ ok: true; cleared: boolean }> {
  return clearBrainConversationEmbedded(id);
}
