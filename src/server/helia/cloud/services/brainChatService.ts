/**
 * Helia Admin Chat persistence — conversations + messages in Cloud document stores.
 */

import { createId } from "../../utils/id";
import { NotFoundError, ValidationError } from "../../utils/errors";
import type { CloudDatabase } from "../persistence/cloudDatabase";
import type {
  BrainConversationRecord,
  BrainMessageRecord,
} from "../types";

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

  async listForUser(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      preview?: string;
      updatedAt: string;
    }>
  > {
    await this.db.brainConversations.reload();
    const rows = await this.db.brainConversations.query((c) => c.userId === userId);
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
    await this.db.brainConversations.reload();
    await this.db.brainMessages.reload();
    const conv = await this.db.brainConversations.findById(conversationId);
    if (!conv || conv.userId !== userId) return null;
    const messages = await this.loadMessages(conversationId);
    return { ...conv, messages };
  }

  async createConversation(input: {
    userId: string;
    organizationId: string;
    projectId: string;
    title: string;
    product?: BrainConversationRecord["product"];
  }): Promise<BrainConversationRecord> {
    const now = new Date().toISOString();
    const title = input.title.trim() || "New chat";
    const record: BrainConversationRecord = {
      id: createId("conv"),
      userId: input.userId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      title,
      createdAt: now,
      updatedAt: now,
      ...(input.product ? { product: input.product } : {}),
    };
    await this.db.brainConversations.upsert(record);
    return record;
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
    await this.db.brainConversations.reload();
    await this.db.brainMessages.reload();

    let conv = await this.db.brainConversations.findById(input.conversationId);
    const now = new Date().toISOString();

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

    const userMsg: BrainMessageRecord = {
      id: createId("msg"),
      conversationId: conv.id,
      userId: input.userId,
      role: "user",
      content: input.userContent,
      timestamp: now,
    };
    const assistantMsg: BrainMessageRecord = {
      id: createId("msg"),
      conversationId: conv.id,
      userId: input.userId,
      role: "assistant",
      content: input.assistantContent,
      timestamp: new Date().toISOString(),
    };

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
    const conv = await this.db.brainConversations.findById(conversationId);
    if (!conv || conv.userId !== userId) return null;
    const nextTitle = title.trim();
    if (!nextTitle) throw new ValidationError("title is required");
    const updated: BrainConversationRecord = {
      ...conv,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    };
    await this.db.brainConversations.upsert(updated);
    return updated;
  }

  async delete(userId: string, conversationId: string): Promise<boolean> {
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
