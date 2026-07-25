/**
 * Helia Cloud composition root — wires services for DI.
 */

import type { CloudConfig } from "../config";
import { CloudDatabase } from "../persistence/cloudDatabase";
import { AdminService } from "../services/adminService";
import { ApiKeyService } from "../services/apiKeyService";
import { AuditLogService } from "../services/auditLogService";
import { AuthService } from "../services/authService";
import { BrainChatService } from "../services/brainChatService";
import { GatewayService } from "../services/gatewayService";
import { OrganizationService } from "../services/organizationService";
import { ProjectService } from "../services/projectService";
import { SubscriptionService } from "../services/subscriptionService";
import { UsageService } from "../services/usageService";

export interface CloudContainer {
  config: CloudConfig;
  db: CloudDatabase;
  auth: AuthService;
  organizations: OrganizationService;
  projects: ProjectService;
  apiKeys: ApiKeyService;
  subscriptions: SubscriptionService;
  usage: UsageService;
  gateway: GatewayService;
  audit: AuditLogService;
  admin: AdminService;
  brainChat: BrainChatService;
}

export async function createCloudContainer(
  config: CloudConfig
): Promise<CloudContainer> {
  const db = new CloudDatabase(config.dataDir);
  await db.init();

  const auth = new AuthService(db, config);
  const organizations = new OrganizationService(db);
  const projects = new ProjectService(db, organizations);
  const apiKeys = new ApiKeyService(db, organizations, config);
  const subscriptions = new SubscriptionService(db, organizations);
  const usage = new UsageService(db);
  const gateway = new GatewayService(db, apiKeys, subscriptions, usage);
  const audit = new AuditLogService(db);
  gateway.setAudit(audit);
  const admin = new AdminService(db, config, audit);
  const brainChat = new BrainChatService(db);
  await admin.bootstrapAdmins();

  return {
    config,
    db,
    auth,
    organizations,
    projects,
    apiKeys,
    subscriptions,
    usage,
    gateway,
    audit,
    admin,
    brainChat,
  };
}
