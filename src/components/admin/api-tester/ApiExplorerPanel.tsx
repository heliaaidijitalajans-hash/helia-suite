"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AdminPanel, adminInputClass } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import type { CatalogRoute, HttpMethod } from "./types";

/** Display order for explorer categories (only non-empty groups render). */
const CATEGORY_ORDER = [
  "Authentication",
  "API Keys",
  "Organizations",
  "Projects",
  "Applications",
  "Usage",
  "Analytics",
  "Logs",
  "Health",
  "Brain",
  "Chat",
  "Admin",
  "Documentation",
] as const;

type ExplorerLeaf = {
  route: CatalogRoute;
  method: HttpMethod;
  key: string;
};

function normalizeGroup(group: string): string {
  if (group === "Auth") return "Authentication";
  if (group === "Monitoring") return "Health";
  return group;
}

function authLabel(route: CatalogRoute): string {
  switch (route.authentication) {
    case "api_key":
      return "API Key";
    case "session":
      return "Session";
    case "admin_session":
      return "Admin session";
    case "public":
      return "Public";
    default:
      return route.authentication;
  }
}

function methodTone(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "bg-emerald-500/15 text-emerald-200";
    case "POST":
      return "bg-sky-500/15 text-sky-200";
    case "PUT":
      return "bg-amber-500/15 text-amber-200";
    case "PATCH":
      return "bg-violet-500/15 text-violet-200";
    case "DELETE":
      return "bg-red-500/15 text-red-200";
  }
}

export function ApiExplorerPanel({
  routes,
  loading,
  selectedPath,
  selectedMethod,
  onSelect,
}: {
  routes: CatalogRoute[];
  loading?: boolean;
  selectedPath: string;
  selectedMethod: HttpMethod;
  onSelect: (route: CatalogRoute, method: HttpMethod) => void;
}) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | HttpMethod>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [authFilter, setAuthFilter] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedLeaf, setExpandedLeaf] = useState<string | null>(null);

  const leaves = useMemo(() => {
    const out: ExplorerLeaf[] = [];
    for (const route of routes) {
      const group = normalizeGroup(route.group);
      for (const method of route.methods) {
        out.push({
          route: { ...route, group },
          method,
          key: `${method} ${route.path}`,
        });
      }
    }
    return out;
  }, [routes]);

  const categories = useMemo(() => {
    const present = new Set(leaves.map((l) => l.route.group));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present]
      .filter((c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]))
      .sort();
    return [...ordered, ...extras];
  }, [leaves]);

  const authOptions = useMemo(() => {
    const set = new Set(leaves.map((l) => l.route.authentication));
    return [...set].sort();
  }, [leaves]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((leaf) => {
      if (methodFilter !== "all" && leaf.method !== methodFilter) return false;
      if (categoryFilter !== "all" && leaf.route.group !== categoryFilter) {
        return false;
      }
      if (authFilter !== "all" && leaf.route.authentication !== authFilter) {
        return false;
      }
      if (!q) return true;
      const hay = [
        leaf.method,
        leaf.route.path,
        leaf.route.group,
        leaf.route.description || "",
        leaf.route.authentication,
        leaf.route.file,
        leaf.route.apiKeySupported ? "api key" : "",
        leaf.route.sessionRequired ? "session" : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [authFilter, categoryFilter, leaves, methodFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExplorerLeaf[]>();
    for (const leaf of filtered) {
      const list = map.get(leaf.route.group) || [];
      list.push(leaf);
      map.set(leaf.route.group, list);
    }
    const order = [
      ...CATEGORY_ORDER.filter((c) => map.has(c)),
      ...[...map.keys()]
        .filter(
          (c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number])
        )
        .sort(),
    ];
    return order.map((group) => ({
      group,
      items: (map.get(group) || []).sort(
        (a, b) =>
          a.route.path.localeCompare(b.route.path) ||
          a.method.localeCompare(b.method)
      ),
    }));
  }, [filtered]);

  function toggleGroup(group: string) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  return (
    <AdminPanel
      title="API Explorer"
      description="Live endpoints from src/app/api — click a route to load the Request Builder."
    >
      {loading ? (
        <p className="text-sm text-white/45">Scanning API routes…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <input
              className={cn(adminInputClass, "md:col-span-1")}
              placeholder="Search endpoints…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={adminInputClass}
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value as "all" | HttpMethod)
              }
            >
              <option value="all">All methods</option>
              {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className={adminInputClass}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className={adminInputClass}
              value={authFilter}
              onChange={(e) => setAuthFilter(e.target.value)}
            >
              <option value="all">All authentication</option>
              {authOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-white/40">
            {filtered.length} endpoint
            {filtered.length === 1 ? "" : "s"}
            {routes.length ? ` · ${routes.length} routes discovered` : ""}
          </p>

          {grouped.length === 0 ? (
            <p className="text-sm text-white/45">No endpoints match filters.</p>
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
              {grouped.map(({ group, items }) => {
                const isCollapsed = Boolean(collapsed[group]);
                return (
                  <div
                    key={group}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                      onClick={() => toggleGroup(group)}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-white/85">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-white/40" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/40" />
                        )}
                        {group}
                      </span>
                      <span className="text-[11px] text-white/35">
                        {items.length}
                      </span>
                    </button>

                    {!isCollapsed ? (
                      <ul className="space-y-1 border-t border-white/[0.05] px-2 py-2">
                        {items.map((leaf) => {
                          const active =
                            selectedPath.split("?")[0] === leaf.route.path &&
                            selectedMethod === leaf.method;
                          const detailOpen = expandedLeaf === leaf.key;
                          return (
                            <li key={leaf.key}>
                              <button
                                type="button"
                                className={cn(
                                  "flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors",
                                  active
                                    ? "bg-accent/10 ring-1 ring-accent/25"
                                    : "hover:bg-white/[0.04]"
                                )}
                                onClick={() => {
                                  onSelect(leaf.route, leaf.method);
                                  setExpandedLeaf(leaf.key);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold",
                                      methodTone(leaf.method)
                                    )}
                                  >
                                    {leaf.method}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/80">
                                    {leaf.route.path}
                                  </span>
                                </div>
                                {detailOpen || active ? (
                                  <div className="space-y-1 pl-[3.75rem] text-[11px] text-white/45">
                                    {leaf.route.description ? (
                                      <p className="text-white/55">
                                        {leaf.route.description}
                                      </p>
                                    ) : null}
                                    <p>
                                      Auth:{" "}
                                      <span className="text-white/70">
                                        {authLabel(leaf.route)}
                                      </span>
                                      {" · "}
                                      API Key:{" "}
                                      <span className="text-white/70">
                                        {leaf.route.apiKeySupported
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                      {" · "}
                                      Session:{" "}
                                      <span className="text-white/70">
                                        {leaf.route.sessionRequired
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </p>
                                    <p className="truncate font-mono text-[10px] text-white/35">
                                      {leaf.route.file}
                                    </p>
                                  </div>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminPanel>
  );
}
