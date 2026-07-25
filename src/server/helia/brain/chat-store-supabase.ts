/**
 * Durable Helia Admin Chat store (Supabase).
 * Single source of truth: helia_brain_conversations / helia_brain_messages.
 * Survives refresh / cold starts — used whenever Cloud runs on Supabase.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  BrainConversationRecord,
  BrainMessageRecord,
} from "@/server/helia/cloud/types";
import type {
  BrainChatConversation,
  BrainChatMessage,
} from "@/server/helia/cloud/services/brainChatService";

type ConvRow = {
  id: string;
  user_id: string;
  organization_id: string;
  project_id: string;
  title: string;
  preview: string | null;
  product: string | null;
  created_at: string;
  updated_at: string;
};

type MsgRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseChatStoreEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) &&
      process.env.HELIA_CHAT_STORE !== "file"
  );
}

export class SupabaseBrainChatStore {
  private readonly sb: SupabaseClient;

  constructor(client?: SupabaseClient | null) {
    const c = client ?? adminClient();
    if (!c) throw new Error("Supabase chat store unavailable");
    this.sb = c;
  }

  async listForUser(userId: string) {
    const { data, error } = await this.sb
      .from("helia_brain_conversations")
      .select("id, title, preview, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id as string,
      title: c.title as string,
      ...(c.preview ? { preview: c.preview as string } : {}),
      updatedAt: c.updated_at as string,
    }));
  }

  async getForUser(
    userId: string,
    conversationId: string
  ): Promise<BrainChatConversation | null> {
    const { data: conv, error } = await this.sb
      .from("helia_brain_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!conv) return null;

    const { data: msgs, error: msgErr } = await this.sb
      .from("helia_brain_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true });
    if (msgErr) throw msgErr;

    const row = conv as ConvRow;
    const messages: BrainChatMessage[] = (msgs as MsgRow[] | null)?.map(
      (m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.timestamp,
      })
    ) ?? [];

    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      title: row.title,
      ...(row.preview ? { preview: row.preview } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.product
        ? {
            product: row.product as BrainConversationRecord["product"],
          }
        : {}),
      messages,
    };
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
    userMsg: BrainMessageRecord;
    assistantMsg: BrainMessageRecord;
  }): Promise<BrainChatConversation> {
    const now = new Date().toISOString();
    const existing = await this.getForUser(input.userId, input.conversationId);

    const conv: ConvRow = {
      id: input.conversationId,
      user_id: input.userId,
      organization_id: input.organizationId,
      project_id: input.projectId,
      title: existing?.title || input.titleIfNew.trim() || "New chat",
      preview: input.userContent,
      product: input.product ?? existing?.product ?? "helia-suite",
      created_at: existing?.createdAt || now,
      updated_at: now,
    };

    const { error: upsertErr } = await this.sb
      .from("helia_brain_conversations")
      .upsert(conv, { onConflict: "id" });
    if (upsertErr) throw upsertErr;

    const { error: msgErr } = await this.sb.from("helia_brain_messages").upsert(
      [
        {
          id: input.userMsg.id,
          conversation_id: input.userMsg.conversationId,
          user_id: input.userMsg.userId,
          role: input.userMsg.role,
          content: input.userMsg.content,
          timestamp: input.userMsg.timestamp,
        },
        {
          id: input.assistantMsg.id,
          conversation_id: input.assistantMsg.conversationId,
          user_id: input.assistantMsg.userId,
          role: input.assistantMsg.role,
          content: input.assistantMsg.content,
          timestamp: input.assistantMsg.timestamp,
        },
      ],
      { onConflict: "id" }
    );
    if (msgErr) throw msgErr;

    const full = await this.getForUser(input.userId, input.conversationId);
    if (!full) throw new Error("Failed to reload conversation after append");
    return full;
  }

  async rename(userId: string, conversationId: string, title: string) {
    const { data, error } = await this.sb
      .from("helia_brain_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as ConvRow;
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      title: row.title,
      ...(row.preview ? { preview: row.preview } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.product
        ? { product: row.product as BrainConversationRecord["product"] }
        : {}),
    } satisfies BrainConversationRecord;
  }

  async delete(userId: string, conversationId: string): Promise<boolean> {
    const { error: msgErr } = await this.sb
      .from("helia_brain_messages")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (msgErr) throw msgErr;

    const { data, error } = await this.sb
      .from("helia_brain_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", userId)
      .select("id");
    if (error) throw error;
    return Boolean(data && data.length > 0);
  }
}
