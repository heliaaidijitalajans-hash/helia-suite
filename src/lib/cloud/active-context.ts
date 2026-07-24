/**
 * Active organization / project selection (client-side workspace context).
 */

const ORG_KEY = "helia_active_organization_id";
const PROJECT_KEY = "helia_active_project_id";

export function getActiveOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ORG_KEY);
}

export function setActiveOrganizationId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (!id) {
    window.localStorage.removeItem(ORG_KEY);
    return;
  }
  window.localStorage.setItem(ORG_KEY, id);
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROJECT_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (!id) {
    window.localStorage.removeItem(PROJECT_KEY);
    return;
  }
  window.localStorage.setItem(PROJECT_KEY, id);
}
