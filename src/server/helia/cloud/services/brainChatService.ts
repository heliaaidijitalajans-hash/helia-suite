/**
 * Helia Admin Chat persistence — conversations + messages.
 * Prefers durable Supabase store; falls back to Cloud JSON files.
 */

import { createId } from "../../utils/id";
import { NotFoundError, ValidationError } from "../../utils/errors";
import type { CloudDatabase } from "../persistence/cloudDatabase";
import type {
  BrainConversationRecord,
  BrainMessageRecord,
} from "../types";
import {
  isSupabaseChatStoreEnabled,
  SupabaseBrainChatStore,
} from "@/server/helia/brain/chat-store-supabase";

export type BrainChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type BrainChatConversation = BrainConversationRecord & {
  messages: BrainChatMessage[];
};

export class BrainChatService {
  constructor(private readonly db: CloudDatabase) {}

  private supabase(): SupabaseBrainChatStore | null {
    if (!isSupabaseChatStoreEnabled()) return null;
    try {
      return new SupabaseBrainChatStore();
    } catch {
      return null;
    }
  }

  async listForUser(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      preview?: string;
      updatedAt: string;
    }>
  > {
    const remote = this.supabase();
    if (remote) {
      try {
        return await remote.listForUser(userId);
      } catch {
        // fall through to file store
      }
    }

    await this.db.brainConversations.reload();
    const rows = await this.db.brainConversations.query(
      (c) => c.userId === userId
    );
    return rows
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((c) => ({
        id: c.id,
        title: c.title,
        ...(c.preview ? { preview: c.preview } : {}),
        updatedAt: c.updatedAt,
      }));
  }

  async getForUser(
    userId: string,
    conversationId: string
  ): Promise<BrainChatConversation | null> {
    const remote = this.supabase();
    if (remote) {
      try {
        const found = await remote.getForUser(userId, conversationId);
        if (found) return found;
      } catch {
        // fall through
      }
    }

    await this.db.brainConversations.reload();
    await this.db.brainMessages.reload();
    const conv = await this.db.brainConversations.findById(conversationId);
    if (!conv || conv.userId !== userId) return null;
    const messages = await this.loadMessages(conversationId);
    return { ...conv, messages };
  }

  async appendMessages(input: {
    userId: string;
    conversationId: string;
    organizationId: string;
    projectId: string;
    titleIfNew: string;
    product?: BrainConversationRecord["product"];
    userContent: string;
    assistantContent: string;
  }): Promise<BrainChatConversation> {
    const now = new Date().toISOString();
    const userMsg: BrainMessageRecord = {
      id: createId("msg"),
      conversationId: input.conversationId,
      userId: input.userId,
      role: "user",
      content: input.userContent,
      timestamp: now,
    };
    const assistantMsg: BrainMessageRecord = {
      id: createId("msg"),
      conversationId: input.conversationId,
      userId: input.userId,
      role: "assistant",
      content: input.assistantContent,
      timestamp: new Date().toISOString(),
    };

    const remote = this.supabase();
    if (remote) {
      try {
        return await remote.appendMessages({
          ...input,
          userMsg,
          assistantMsg,
        });
      } catch {
        // fall through to local file persistence
      }
    }

    await this.db.brainConversations.reload();
    await this.db.brainMessages.reload();

    let conv = await this.db.brainConversations.findById(input.conversationId);

    if (!conv) {
      conv = {
        id: input.conversationId,
        userId: input.userId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: input.titleIfNew.trim() || "New chat",
        preview: input.userContent,
        createdAt: now,
        updatedAt: now,
        ...(input.product ? { product: input.product } : {}),
      };
    } else {
      if (conv.userId !== input.userId) {
        throw new NotFoundError("Conversation", input.conversationId);
      }
      conv = {
        ...conv,
        preview: input.userContent,
        updatedAt: now,
      };
    }

    await this.db.brainConversations.upsert(conv);
    await this.db.brainMessages.upsert(userMsg);
    await this.db.brainMessages.upsert(assistantMsg);

    const messages = await this.loadMessages(conv.id);
    return { ...conv, messages };
  }

  async rename(
    userId: string,
    conversationId: string,
    title: string
  ): Promise<BrainConversationRecord | null> {
    const nextTitle = title.trim();
    if (!nextTitle) throw new ValidationError("title is required");

    const remote = this.supabase();
    if (remote) {
      try {
        const updated = await remote.rename(userId, conversationId, nextTitle);
        if (updated) return updated;
      } catch {
        // fall through
      }
    }

    const conv = await this.db.brainConversations.findById(conversationId);
    if (!conv || conv.userId !== userId) return null;
    const updated: BrainConversationRecord = {
      ...conv,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    };
    await this.db.brainConversations.upsert(updated);
    return updated;
  }

  async delete(userId: string, conversationId: string): Promise<boolean> {
    const remote = this.supabase();
    if (remote) {
      try {
        const ok = await remote.delete(userId, conversationId);
        if (ok) return true;
      } catch {
        // fall through
      }
    }

    const conv = await this.db.brainConversations.findById(conversationId);
    if (!conv || conv.userId !== userId) return false;
    const messages = await this.db.brainMessages.query(
      (m) => m.conversationId === conversationId
    );
    for (const message of messages) {
      await this.db.brainMessages.delete(message.id);
    }
    return this.db.brainConversations.delete(conversationId);
  }

  private async loadMessages(
    conversationId: string
  ): Promise<BrainChatMessage[]> {
    const rows = await this.db.brainMessages.query(
      (m) => m.conversationId === conversationId
    );
    return rows
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.timestamp,
      }));
  }
}
