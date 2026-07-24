/**
 * End-to-end API Key flow verification (in-process, no mocks).
 * Run: npx --yes tsx scripts/verify-api-key-e2e.ts
 */

import os from "node:os";
import path from "node:path";
import {
  loadCloudConfig,
  resetCloudConfigCache,
} from "../src/server/helia/cloud/config";
import { createCloudContainer } from "../src/server/helia/cloud/composition/container";
import { ensureDefaultWorkspace } from "../src/server/helia/cloud/services/workspaceBootstrap";
import { parseCreateApiKeyBody } from "../src/lib/api-keys";

async function main() {
  process.env.CLOUD_DATA_DIR = path.join(
    os.tmpdir(),
    `helia-apikey-e2e-${Date.now()}`
  );
  resetCloudConfigCache();
  const config = loadCloudConfig();
  const container = await createCloudContainer(config);

  console.log("1) Register user");
  const registered = await container.auth.register({
    email: `apikey-e2e-${Date.now()}@helia.test`,
    password: "password12345",
    displayName: "API Key E2E",
  });
  const userId = registered.user.id;

  console.log("2) Ensure default workspace (no manual project/org)");
  const workspace = await ensureDefaultWorkspace(container, userId);
  console.log(`   org=${workspace.organization.id} project=${workspace.project.id}`);

  console.log("3) Validate create payload schema");
  const body = parseCreateApiKeyBody({
    name: "E2E Key",
    keyEnvironment: "test",
    applicationType: "backend",
    capabilities: ["monitoring", "health"],
    permissions: ["read"],
  });
  if (body.projectId) throw new Error("projectId should be optional");

  console.log("4) Create API key (server resolves project)");
  const created = await container.apiKeys.create({
    userId,
    projectId: workspace.project.id,
    name: body.name,
    keyEnvironment: body.keyEnvironment,
    applicationType: body.applicationType,
    capabilities: body.capabilities,
    permissions: body.permissions,
  });
  if (!created.secret.startsWith("hl_test_")) {
    throw new Error(`Unexpected secret prefix: ${created.secret.slice(0, 12)}`);
  }
  console.log(`   id=${created.record.id} prefix=${created.record.prefix}`);

  console.log("5) Persist + list");
  const listed = await container.apiKeys.listForUser(userId);
  if (!listed.some((k) => k.id === created.record.id)) {
    throw new Error("Created key missing from listForUser");
  }

  console.log("6) whoami / authenticate + track usage");
  const ctx = await container.gateway.authenticateApiKey(created.secret);
  if (ctx.apiKey.id !== created.record.id) {
    throw new Error("whoami resolved wrong key");
  }
  await container.gateway.trackRequest(ctx, "requests");
  await container.gateway.trackRequest(ctx, "requests");

  console.log("7) Usage recorded");
  const usage = await container.usage.summarizeOrganization(
    workspace.organization.id
  );
  if (usage.totals.requests < 2) {
    throw new Error(`Expected usage requests >= 2, got ${usage.totals.requests}`);
  }
  console.log(`   month=${usage.month} requests=${usage.totals.requests}`);

  console.log("\nAPI Key flow verified end-to-end.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
