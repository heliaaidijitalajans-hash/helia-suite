/**
 * In-process Helia Cloud runtime for Next.js Route Handlers (Vercel-ready).
 */

import { createCloudContainer, type CloudContainer } from "./cloud/composition/container";
import { loadCloudConfig } from "./cloud/config";

declare global {
  var __heliaCloudContainerPromise: Promise<CloudContainer> | undefined;
}

export async function getCloudContainer(): Promise<CloudContainer> {
  if (!globalThis.__heliaCloudContainerPromise) {
    const config = loadCloudConfig();
    globalThis.__heliaCloudContainerPromise = createCloudContainer(config);
  }
  return globalThis.__heliaCloudContainerPromise;
}

/** Test / HMR helper — drop the singleton so the next call rebuilds. */
export function resetCloudContainer(): void {
  globalThis.__heliaCloudContainerPromise = undefined;
}
