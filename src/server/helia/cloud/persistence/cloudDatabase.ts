/**
 * Helia Cloud persistence root.
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

export class CloudDatabase {
  readonly users: CloudDocumentStore<CloudUser>;
  readonly sessions: CloudDocumentStore<CloudSession>;
  readonly organizations: CloudDocumentStore<Organization>;
  readonly memberships: CloudDocumentStore<OrganizationMembership>;
  readonly projects: CloudDocumentStore<Project>;
  readonly apiKeys: CloudDocumentStore<ApiKeyRecord>;
  readonly subscriptions: CloudDocumentStore<SubscriptionRecord>;
  readonly usage: CloudDocumentStore<UsageBucket>;
  readonly auditLogs: CloudDocumentStore<AuditLogRecord>;
  readonly settings: CloudDocumentStore<AdminSettingsRecord>;
  readonly brainConversations: CloudDocumentStore<BrainConversationRecord>;
  readonly brainMessages: CloudDocumentStore<BrainMessageRecord>;

  constructor(dataDir: string) {
    this.users = new CloudDocumentStore(join(dataDir, "users.json"));
    this.sessions = new CloudDocumentStore(join(dataDir, "sessions.json"));
    this.organizations = new CloudDocumentStore(
      join(dataDir, "organizations.json")
    );
    this.memberships = new CloudDocumentStore(join(dataDir, "memberships.json"));
    this.projects = new CloudDocumentStore(join(dataDir, "projects.json"));
    this.apiKeys = new CloudDocumentStore(join(dataDir, "api-keys.json"), 100_000);
    this.subscriptions = new CloudDocumentStore(
      join(dataDir, "subscriptions.json")
    );
    this.usage = new CloudDocumentStore(join(dataDir, "usage.json"), 200_000);
    this.auditLogs = new CloudDocumentStore(
      join(dataDir, "audit-logs.json"),
      50_000
    );
    this.settings = new CloudDocumentStore(join(dataDir, "admin-settings.json"), 10);
    this.brainConversations = new CloudDocumentStore(
      join(dataDir, "brain-conversations.json"),
      50_000
    );
    this.brainMessages = new CloudDocumentStore(
      join(dataDir, "brain-messages.json"),
      200_000
    );
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
