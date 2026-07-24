/**
 * Verifies API key creation for every applicationType enum.
 * Run: npx --yes tsx scripts/verify-api-key-application-types.ts
 */

import os from "node:os";
import path from "node:path";
import {
  APPLICATION_TYPE_LABELS,
  APPLICATION_TYPES,
  parseCreateApiKeyBody,
  toApplicationTypeEnum,
} from "../src/lib/api-keys";
import {
  loadCloudConfig,
  resetCloudConfigCache,
} from "../src/server/helia/cloud/config";
import { createCloudContainer } from "../src/server/helia/cloud/composition/container";

async function main() {
  process.env.CLOUD_DATA_DIR = path.join(
    os.tmpdir(),
    `helia-apikey-verify-${Date.now()}`
  );
  resetCloudConfigCache();
  const config = loadCloudConfig();
  const container = await createCloudContainer(config);

  const registered = await container.auth.register({
    email: `verify-${Date.now()}@helia.test`,
    password: "password123",
    displayName: "Verify User",
  });
  const userId = registered.user.id;

  const { organization } = await container.organizations.create({
    userId,
    name: "Verify Org",
    planId: "professional",
  });
  const project = await container.projects.create({
    userId,
    organizationId: organization.id,
    name: "Verify Project",
    environment: "development",
  });

  console.log("Mapping table (UI label → payload enum):");
  for (const value of APPLICATION_TYPES) {
    const label = APPLICATION_TYPE_LABELS[value];
    const fromLabel = toApplicationTypeEnum(label);
    const parsed = parseCreateApiKeyBody({
      projectId: project.id,
      name: `key-${value}`,
      keyEnvironment: "test",
      applicationType: value,
      capabilities: ["monitoring", "health"],
      permissions: ["read"],
    });
    if (fromLabel !== value) {
      throw new Error(`Label map failed for ${label}`);
    }
    if (parsed.applicationType !== value) {
      throw new Error(`Schema parse failed for ${value}`);
    }
    console.log(`  ${label.padEnd(20)} → ${value}`);
  }

  console.log("\nCreating API keys for each application type…");
  for (const applicationType of APPLICATION_TYPES) {
    const created = await container.apiKeys.create({
      userId,
      projectId: project.id,
      name: `Verify ${applicationType}`,
      keyEnvironment: "test",
      applicationType,
      capabilities:
        applicationType === "internal_platform"
          ? undefined
          : ["monitoring", "health"],
      permissions:
        applicationType === "internal_platform" ? undefined : ["read"],
    });
    const stored = created.record.applicationType;
    if (stored !== applicationType) {
      throw new Error(
        `Stored applicationType mismatch: expected ${applicationType}, got ${stored}`
      );
    }
    console.log(
      `  OK ${applicationType} → ${created.record.prefix}…${created.record.lastFour}`
    );
  }

  // Label payloads must coerce to enums (never stored as labels).
  const fromUiLabel = parseCreateApiKeyBody({
    projectId: project.id,
    name: "From label",
    applicationType: "Internal Platform",
  });
  if (fromUiLabel.applicationType !== "internal_platform") {
    throw new Error("Failed to coerce Internal Platform → internal_platform");
  }
  console.log("\nLabel coercion OK: Internal Platform → internal_platform");
  console.log("\nAll application types verified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
