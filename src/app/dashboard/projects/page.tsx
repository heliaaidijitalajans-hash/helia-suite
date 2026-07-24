"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getActiveOrganizationId,
  getActiveProjectId,
  setActiveOrganizationId,
  setActiveProjectId,
} from "@/lib/cloud/active-context";
import { cn } from "@/lib/cn";
import {
  createProject,
  listOrganizations,
  listProjects,
  type CloudOrganization,
  type CloudProject,
  type ProjectEnvironment,
} from "@/services/cloud";
import {
  CloudAlert,
  CloudField,
  CloudPanel,
  cloudBtnDangerClass,
  cloudBtnPrimaryClass,
  cloudBtnSecondaryClass,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";

const ENVIRONMENTS: ProjectEnvironment[] = [
  "production",
  "development",
  "staging",
];

export default function ProjectsPage() {
  const [orgs, setOrgs] = useState<CloudOrganization[]>([]);
  const [items, setItems] = useState<CloudProject[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [activeProjectId, setActiveProject] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [environment, setEnvironment] =
    useState<ProjectEnvironment>("development");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [editing, setEditing] = useState<CloudProject | null>(null);
  const [editName, setEditName] = useState("");
  const [editEnvironment, setEditEnvironment] =
    useState<ProjectEnvironment>("development");

  const refresh = useCallback(async (orgId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const organizations = await listOrganizations();
      setOrgs(organizations);
      const storedOrg = orgId || getActiveOrganizationId();
      const nextOrg =
        (storedOrg &&
          organizations.some((o) => o.id === storedOrg) &&
          storedOrg) ||
        organizations[0]?.id ||
        "";
      setOrganizationId(nextOrg);
      if (nextOrg) setActiveOrganizationId(nextOrg);

      const projects = nextOrg
        ? await listProjects(nextOrg)
        : await listProjects();
      setItems(projects);

      const storedProject = getActiveProjectId();
      const nextProject =
        (storedProject &&
          projects.some((p) => p.id === storedProject) &&
          storedProject) ||
        projects[0]?.id ||
        null;
      setActiveProject(nextProject);
      if (nextProject) setActiveProjectId(nextProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleOrgFilter(next: string) {
    setOrganizationId(next);
    setActiveOrganizationId(next || null);
    await refresh(next);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId || !name.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const project = await createProject({
        organizationId,
        name: name.trim(),
        environment,
      });
      setName("");
      setInfo(`Created project “${project.name}” (${project.environment}).`);
      await refresh(organizationId);
      setActiveProject(project.id);
      setActiveProjectId(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(project: CloudProject) {
    setEditing(project);
    setEditName(project.name);
    setEditEnvironment(project.environment);
    setError(null);
    setInfo(null);
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setInfo(
      `Edit unavailable: Helia Cloud does not expose PATCH /projects/:id. “${editing.name}” was not changed.`
    );
    setEditing(null);
  }

  function handleDelete(project: CloudProject) {
    setError(null);
    setInfo(
      `Delete unavailable: Helia Cloud does not expose DELETE /projects/:id. “${project.name}” was not removed.`
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? <CloudAlert message={error} /> : null}
      {info ? <CloudAlert message={info} tone="info" /> : null}

      <CloudPanel
        title="Create project"
        description="POST /projects — environment: production, development, or staging."
      >
        <form onSubmit={(e) => void handleCreate(e)} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <CloudField label="Organization">
              <select
                className={cloudInputClass}
                value={organizationId}
                onChange={(e) => void handleOrgFilter(e.target.value)}
                required
              >
                {orgs.length === 0 ? (
                  <option value="">No organizations</option>
                ) : (
                  orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))
                )}
              </select>
            </CloudField>
            <CloudField label="Name">
              <input
                className={cloudInputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="SnapSell"
                required
              />
            </CloudField>
            <CloudField label="Environment">
              <select
                className={cloudInputClass}
                value={environment}
                onChange={(e) =>
                  setEnvironment(e.target.value as ProjectEnvironment)
                }
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </CloudField>
          </div>
          <button
            type="submit"
            disabled={busy || !organizationId}
            className={cn(cloudBtnPrimaryClass, "w-fit")}
          >
            Create project
          </button>
        </form>
      </CloudPanel>

      {editing ? (
        <CloudPanel
          title={`Edit ${editing.name}`}
          description="Project update routes are not published on Helia Cloud yet."
          actions={
            <button
              type="button"
              className={cloudBtnSecondaryClass}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          }
        >
          <form onSubmit={handleEditSave} className="grid gap-4 md:grid-cols-3">
            <CloudField label="Name">
              <input
                className={cloudInputClass}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </CloudField>
            <CloudField label="Environment">
              <select
                className={cloudInputClass}
                value={editEnvironment}
                onChange={(e) =>
                  setEditEnvironment(e.target.value as ProjectEnvironment)
                }
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </CloudField>
            <div className="flex items-end">
              <button type="submit" className={cloudBtnPrimaryClass}>
                Save
              </button>
            </div>
          </form>
        </CloudPanel>
      ) : null}

      <CloudPanel
        title="Projects"
        description={
          loading
            ? "Loading…"
            : `${items.length} project${items.length === 1 ? "" : "s"}`
        }
      >
        {loading ? (
          <p className="text-sm text-white/45">Loading projects…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-white/45">No projects for this organization.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {items.map((project, i) => {
              const active = project.id === activeProjectId;
              return (
                <motion.li
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {project.name}
                      {active ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                          Active
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {project.environment} · {project.slug} · {project.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cloudBtnSecondaryClass}
                      disabled={active}
                      onClick={() => {
                        setActiveProject(project.id);
                        setActiveProjectId(project.id);
                        setInfo("Active project updated for this workspace.");
                      }}
                    >
                      {active ? "Selected" : "Select"}
                    </button>
                    <button
                      type="button"
                      className={cloudBtnSecondaryClass}
                      onClick={() => openEdit(project)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={cloudBtnDangerClass}
                      onClick={() => handleDelete(project)}
                    >
                      Delete
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CloudPanel>
    </div>
  );
}
