"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "@/lib/cloud/active-context";
import { cn } from "@/lib/cn";
import {
  changeOrganizationPlan,
  createOrganization,
  listOrganizations,
  listPlans,
  type CloudOrganization,
  type CloudPlan,
  type PlanId,
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

export default function OrganizationsPage() {
  const [items, setItems] = useState<CloudOrganization[]>([]);
  const [plans, setPlans] = useState<CloudPlan[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [planId, setPlanId] = useState<PlanId>("free");
  const [editing, setEditing] = useState<CloudOrganization | null>(null);
  const [editPlanId, setEditPlanId] = useState<PlanId>("free");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orgs, planItems] = await Promise.all([
        listOrganizations(),
        listPlans(),
      ]);
      setItems(orgs);
      setPlans(planItems);
      const stored = getActiveOrganizationId();
      const nextActive =
        (stored && orgs.some((o) => o.id === stored) && stored) ||
        orgs[0]?.id ||
        null;
      setActiveId(nextActive);
      if (nextActive) setActiveOrganizationId(nextActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const org = await createOrganization({ name: name.trim(), planId });
      setName("");
      setInfo(`Created organization “${org.name}”.`);
      await refresh();
      setActiveId(org.id);
      setActiveOrganizationId(org.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  function selectActive(id: string) {
    setActiveId(id);
    setActiveOrganizationId(id);
    setInfo("Active organization updated for this workspace.");
  }

  function openEdit(org: CloudOrganization) {
    setEditing(org);
    setEditPlanId(org.planId);
    setInfo(null);
    setError(null);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await changeOrganizationPlan({
        organizationId: editing.id,
        planId: editPlanId,
      });
      setInfo(
        `Updated plan for “${editing.name}”. Organization rename/delete are not exposed by Helia Cloud yet.`
      );
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(org: CloudOrganization) {
    setError(null);
    setInfo(
      `Delete is unavailable: Helia Cloud does not expose DELETE /organizations/:id. “${org.name}” was not removed.`
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? <CloudAlert message={error} /> : null}
      {info ? <CloudAlert message={info} tone="info" /> : null}

      <CloudPanel
        title="Create organization"
        description="POST /organizations — connected to Helia Cloud."
      >
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end"
        >
          <CloudField label="Name">
            <input
              className={cloudInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </CloudField>
          <CloudField label="Plan">
            <select
              className={cloudInputClass}
              value={planId}
              onChange={(e) => setPlanId(e.target.value as PlanId)}
            >
              {(plans.length
                ? plans
                : [{ id: "free" as PlanId, name: "Free" }]
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </CloudField>
          <button
            type="submit"
            disabled={busy}
            className={cn(cloudBtnPrimaryClass, "min-h-11")}
          >
            Create
          </button>
        </form>
      </CloudPanel>

      {editing ? (
        <CloudPanel
          title={`Edit ${editing.name}`}
          description="Plan changes use POST /subscriptions/change-plan."
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
          <form
            onSubmit={(e) => void handleEditSave(e)}
            className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end"
          >
            <CloudField label="Name">
              <input
                className={cn(cloudInputClass, "opacity-70")}
                value={editing.name}
                readOnly
                title="Helia Cloud does not expose organization rename yet"
              />
            </CloudField>
            <CloudField label="Plan">
              <select
                className={cloudInputClass}
                value={editPlanId}
                onChange={(e) => setEditPlanId(e.target.value as PlanId)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </CloudField>
            <button
              type="submit"
              disabled={busy}
              className={cn(cloudBtnPrimaryClass, "min-h-11")}
            >
              Save
            </button>
          </form>
        </CloudPanel>
      ) : null}

      <CloudPanel
        title="Organizations"
        description={
          loading
            ? "Loading…"
            : `${items.length} organization${items.length === 1 ? "" : "s"}`
        }
      >
        {loading ? (
          <p className="text-sm text-white/45">Loading organizations…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-white/45">No organizations yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {items.map((org, i) => {
              const active = org.id === activeId;
              return (
                <motion.li
                  key={org.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {org.name}
                      {active ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                          Active
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {org.slug} · plan {org.planId} · {org.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cloudBtnSecondaryClass}
                      onClick={() => selectActive(org.id)}
                      disabled={active}
                    >
                      {active ? "Selected" : "Select"}
                    </button>
                    <button
                      type="button"
                      className={cloudBtnSecondaryClass}
                      onClick={() => openEdit(org)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={cloudBtnDangerClass}
                      onClick={() => handleDelete(org)}
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
