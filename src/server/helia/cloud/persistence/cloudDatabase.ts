/**
 * Helia Cloud persistence root.
 * Development: JSON document store (local files).
 * Production: Supabase tables (never ephemeral filesystem).
 */

import { join } from "node:path";
import type {
  AdminSettingsRecord,
  ApiKeyRecord,
  AuditLogRecord,
  BrainConversationRecord,
  BrainMessageRecord,
  CloudSession,
  CloudUser,
  Organization,
  OrganizationMembership,
  Project,
  SubscriptionRecord,
  UsageBucket,
} from "../types";
import { CloudDocumentStore } from "./documentStore";
import type { CloudRecordStore } from "./recordStore";
import { BrainDurablePlaceholderStore } from "./brainDurablePlaceholder";
import {
  getSupabaseCloudClient,
  shouldUseSupabaseCloudStore,
} from "./supabase/client";
import { SupabaseCollectionStore } from "./supabase/collectionStore";

export class CloudDatabase {
  readonly users: CloudRecordStore<CloudUser>;
  readonly sessions: CloudRecordStore<CloudSession>;
  readonly organizations: CloudRecordStore<Organization>;
  readonly memberships: CloudRecordStore<OrganizationMembership>;
  readonly projects: CloudRecordStore<Project>;
  readonly apiKeys: CloudRecordStore<ApiKeyRecord>;
  readonly subscriptions: CloudRecordStore<SubscriptionRecord>;
  readonly usage: CloudRecordStore<UsageBucket>;
  readonly auditLogs: CloudRecordStore<AuditLogRecord>;
  readonly settings: CloudRecordStore<AdminSettingsRecord>;
  readonly brainConversations: CloudRecordStore<BrainConversationRecord>;
  readonly brainMessages: CloudRecordStore<BrainMessageRecord>;

  readonly backend: "file" | "supabase";

  private constructor(
    backend: "file" | "supabase",
    stores: {
      users: CloudRecordStore<CloudUser>;
      sessions: CloudRecordStore<CloudSession>;
      organizations: CloudRecordStore<Organization>;
      memberships: CloudRecordStore<OrganizationMembership>;
      projects: CloudRecordStore<Project>;
      apiKeys: CloudRecordStore<ApiKeyRecord>;
      subscriptions: CloudRecordStore<SubscriptionRecord>;
      usage: CloudRecordStore<UsageBucket>;
      auditLogs: CloudRecordStore<AuditLogRecord>;
      settings: CloudRecordStore<AdminSettingsRecord>;
      brainConversations: CloudRecordStore<BrainConversationRecord>;
      brainMessages: CloudRecordStore<BrainMessageRecord>;
    }
  ) {
    this.backend = backend;
    this.users = stores.users;
    this.sessions = stores.sessions;
    this.organizations = stores.organizations;
    this.memberships = stores.memberships;
    this.projects = stores.projects;
    this.apiKeys = stores.apiKeys;
    this.subscriptions = stores.subscriptions;
    this.usage = stores.usage;
    this.auditLogs = stores.auditLogs;
    this.settings = stores.settings;
    this.brainConversations = stores.brainConversations;
    this.brainMessages = stores.brainMessages;
  }

  static createFile(dataDir: string): CloudDatabase {
    return new CloudDatabase("file", {
      users: new CloudDocumentStore(join(dataDir, "users.json")),
      sessions: new CloudDocumentStore(join(dataDir, "sessions.json")),
      organizations: new CloudDocumentStore(join(dataDir, "organizations.json")),
      memberships: new CloudDocumentStore(join(dataDir, "memberships.json")),
      projects: new CloudDocumentStore(join(dataDir, "projects.json")),
      apiKeys: new CloudDocumentStore(join(dataDir, "api-keys.json"), 100_000),
      subscriptions: new CloudDocumentStore(
        join(dataDir, "subscriptions.json")
      ),
      usage: new CloudDocumentStore(join(dataDir, "usage.json"), 200_000),
      auditLogs: new CloudDocumentStore(
        join(dataDir, "audit-logs.json"),
        50_000
      ),
      settings: new CloudDocumentStore(join(dataDir, "admin-settings.json"), 10),
      brainConversations: new CloudDocumentStore(
        join(dataDir, "brain-conversations.json"),
        50_000
      ),
      brainMessages: new CloudDocumentStore(
        join(dataDir, "brain-messages.json"),
        200_000
      ),
    });
  }

  static createSupabase(): CloudDatabase {
    const sb = getSupabaseCloudClient();
    if (!sb) {
      throw new Error("Supabase Cloud client unavailable");
    }
    return new CloudDatabase("supabase", {
      users: new SupabaseCollectionStore(sb, "helia_users"),
      sessions: new SupabaseCollectionStore(sb, "helia_sessions"),
      organizations: new SupabaseCollectionStore(sb, "helia_organizations"),
      memberships: new SupabaseCollectionStore(sb, "helia_memberships"),
      projects: new SupabaseCollectionStore(sb, "helia_projects"),
      apiKeys: new SupabaseCollectionStore(sb, "helia_api_keys", 100_000),
      subscriptions: new SupabaseCollectionStore(sb, "helia_subscriptions"),
      usage: new SupabaseCollectionStore(sb, "helia_usage", 200_000),
      auditLogs: new SupabaseCollectionStore(sb, "helia_audit_logs", 50_000),
      settings: new SupabaseCollectionStore(sb, "helia_admin_settings", 10),
      // Brain SoT is helia_brain_conversations / helia_brain_messages via
      // SupabaseBrainChatStore — these slots must not be used at runtime.
      brainConversations: new BrainDurablePlaceholderStore(),
      brainMessages: new BrainDurablePlaceholderStore(),
    });
  }

  /** Pick durable Supabase in production; JSON files in local development. */
  static create(dataDir: string): CloudDatabase {
    if (shouldUseSupabaseCloudStore()) {
      return CloudDatabase.createSupabase();
    }
    // Dev default, or HELIA_CLOUD_STORE=file (blocked on Vercel by shouldUse…).
    return CloudDatabase.createFile(dataDir);
  }

  async init(): Promise<void> {
    await Promise.all([
      this.users.init(),
      this.sessions.init(),
      this.organizations.init(),
      this.memberships.init(),
      this.projects.init(),
      this.apiKeys.init(),
      this.subscriptions.init(),
      this.usage.init(),
      this.auditLogs.init(),
      this.settings.init(),
      this.brainConversations.init(),
      this.brainMessages.init(),
    ]);
  }
}
