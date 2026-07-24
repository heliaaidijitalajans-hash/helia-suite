/**
 * Helia Cloud composition root — wires services for DI.
 */

import type { CloudConfig } from '../config.js';
import { CloudDatabase } from '../persistence/cloudDatabase.js';
import { ApiKeyService } from '../services/apiKeyService.js';
import { AuthService } from '../services/authService.js';
import { GatewayService } from '../services/gatewayService.js';
import { OrganizationService } from '../services/organizationService.js';
import { ProjectService } from '../services/projectService.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { UsageService } from '../services/usageService.js';

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
}

export async function createCloudContainer(config: CloudConfig): Promise<CloudContainer> {
  const db = new CloudDatabase(config.dataDir);
  await db.init();

  const auth = new AuthService(db, config);
  const organizations = new OrganizationService(db);
  const projects = new ProjectService(db, organizations);
  const apiKeys = new ApiKeyService(db, organizations, config);
  const subscriptions = new SubscriptionService(db, organizations);
  const usage = new UsageService(db);
  const gateway = new GatewayService(db, apiKeys, subscriptions, usage);

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
  };
}
