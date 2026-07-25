/**
 * Conversation persistence scoped by Organization + Project + User + Conversation ID.
 * Server-side JSON store — ready to swap for a DB without changing the chat UI.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { BrainScope, PersistedConversation } from "./types";

function rootDir(): string {
  if (process.env.HELIA_CHAT_DATA_DIR) return process.env.HELIA_CHAT_DATA_DIR;
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "helia-brain-conversations");
  }
  return path.join(process.cwd(), "data", "brain-conversations");
}

function scopeKey(scope: BrainScope): string {
  return `${scope.organizationId}__${scope.projectId}__${scope.userId}`;
}

function scopeDir(scope: BrainScope): string {
  return path.join(rootDir(), scopeKey(scope));
}

function conversationPath(scope: BrainScope, conversationId: string): string {
  const safe = conversationId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(scopeDir(scope), `${safe}.json`);
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function listPersistedConversations(
  scope: BrainScope
): Promise<PersistedConversation[]> {
  const dir = scopeDir(scope);
  try {
    const files = await fs.readdir(dir);
    const items: PersistedConversation[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(dir, file), "utf8");
        items.push(JSON.parse(raw) as PersistedConversation);
      } catch {
        // skip corrupt entries
      }
    }
    return items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function getPersistedConversation(
  scope: BrainScope,
  conversationId: string
): Promise<PersistedConversation | null> {
  try {
    const raw = await fs.readFile(
      conversationPath(scope, conversationId),
      "utf8"
    );
    return JSON.parse(raw) as PersistedConversation;
  } catch {
    return null;
  }
}

export async function savePersistedConversation(
  conversation: PersistedConversation
): Promise<void> {
  const scope: BrainScope = {
    organizationId: conversation.organizationId,
    projectId: conversation.projectId,
    userId: conversation.userId,
  };
  const dir = scopeDir(scope);
  await ensureDir(dir);
  await fs.writeFile(
    conversationPath(scope, conversation.id),
    JSON.stringify(conversation, null, 2),
    "utf8"
  );
}

export async function deletePersistedConversation(
  scope: BrainScope,
  conversationId: string
): Promise<boolean> {
  try {
    await fs.unlink(conversationPath(scope, conversationId));
    return true;
  } catch {
    return false;
  }
}

export async function renamePersistedConversation(
  scope: BrainScope,
  conversationId: string,
  title: string
): Promise<PersistedConversation | null> {
  const existing = await getPersistedConversation(scope, conversationId);
  if (!existing) return null;
  const next: PersistedConversation = {
    ...existing,
    title: title.trim() || existing.title,
    updatedAt: new Date().toISOString(),
  };
  await savePersistedConversation(next);
  return next;
}
