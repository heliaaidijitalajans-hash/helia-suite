/**
 * Helia Cloud composition root — wires services for DI.
 */

import type { CloudConfig } from '../config';
import { CloudDatabase } from '../persistence/cloudDatabase';
import { ApiKeyService } from '../services/apiKeyService';
import { AuthService } from '../services/authService';
import { GatewayService } from '../services/gatewayService';
import { OrganizationService } from '../services/organizationService';
import { ProjectService } from '../services/projectService';
import { SubscriptionService } from '../services/subscriptionService';
import { UsageService } from '../services/usageService';

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
