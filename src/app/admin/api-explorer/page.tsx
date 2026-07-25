"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminEmpty,
  AdminPanel,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";
import type { CatalogRoute } from "@/components/admin/api-tester/types";

export default function AdminApiExplorerPage() {
  const [routes, setRoutes] = useState<CatalogRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch<{
          routes: CatalogRoute[];
          groups: string[];
          count: number;
          generatedAt: string;
        }>("/api/admin/tester/catalog");
        if (!cancelled) setRoutes(res.routes);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(
    () => [...new Set(routes.map((r) => r.group))].sort(),
    [routes]
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return routes.filter((r) => {
      if (groupFilter !== "all" && r.group !== groupFilter) return false;
      if (!q) return true;
      return (
        r.path.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.file.toLowerCase().includes(q) ||
        r.methods.join(" ").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        r.authentication.toLowerCase().includes(q)
      );
    });
  }, [filter, groupFilter, routes]);

  const byGroup = useMemo(() => {
    const map = new Map<string, CatalogRoute[]>();
    for (const r of filtered) {
      const list = map.get(r.group) || [];
      list.push(r);
      map.set(r.group, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <AdminPanel
        title="API Explorer"
        description="Live scan of src/app/api — only routes that exist in this codebase."
        actions={
          <Link href="/admin/api-tester" className={adminBtnSecondary}>
            Open API Tester
          </Link>
        }
      >
        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            {error}
          </p>
        ) : null}

        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_12rem]">
          <input
            className={adminInputClass}
            placeholder="Filter path, method, auth, file…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className={adminInputClass}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-white/45">Scanning API routes…</p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title="No routes matched"
            description="Adjust filters or confirm src/app/api contains route.ts handlers."
          />
        ) : (
          <p className="mb-4 text-xs text-white/40">
            Showing {filtered.length} of {routes.length} discovered routes
          </p>
        )}
      </AdminPanel>

      {byGroup.map(([group, items]) => (
        <AdminPanel key={group} title={group} description={`${items.length} endpoint(s)`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-2 py-2 font-medium">Methods</th>
                  <th className="px-2 py-2 font-medium">Route</th>
                  <th className="px-2 py-2 font-medium">Auth</th>
                  <th className="px-2 py-2 font-medium">Permissions</th>
                  <th className="px-2 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium">File</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.path}
                    className="border-b border-white/[0.04] align-top last:border-0"
                  >
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.methods.map((m) => (
                          <span
                            key={m}
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                              m === "GET" && "bg-emerald-500/15 text-emerald-200",
                              m === "POST" && "bg-sky-500/15 text-sky-200",
                              m === "PUT" && "bg-amber-500/15 text-amber-200",
                              m === "PATCH" && "bg-violet-500/15 text-violet-200",
                              m === "DELETE" && "bg-red-500/15 text-red-200"
                            )}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-3 font-mono text-white/85">{r.path}</td>
                    <td className="px-2 py-3 text-white/60">{r.authentication}</td>
                    <td className="px-2 py-3 text-white/55">
                      {r.permissions.join(", ") || "—"}
                    </td>
                    <td className="px-2 py-3 text-white/50">
                      {r.description || "—"}
                    </td>
                    <td className="px-2 py-3 font-mono text-[10px] text-white/40">
                      {r.file}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      ))}
    </div>
  );
}
