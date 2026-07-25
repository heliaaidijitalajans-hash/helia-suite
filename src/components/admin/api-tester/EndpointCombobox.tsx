"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { adminInputClass } from "@/components/admin/ui";
import type { CatalogRoute, HttpMethod } from "./types";
import { loadRecentEndpoints } from "./storage";

export function EndpointCombobox({
  routes,
  method,
  path,
  onMethodChange,
  onPathChange,
  onPickRoute,
}: {
  routes: CatalogRoute[];
  method: HttpMethod;
  path: string;
  onMethodChange: (m: HttpMethod) => void;
  onPathChange: (p: string) => void;
  onPickRoute: (route: CatalogRoute, method: HttpMethod) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(path);
  const [recent, setRecent] = useState(() => loadRecentEndpoints());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(path);
  }, [path]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = useMemo(
    () => routes.find((r) => r.path === path.split("?")[0]),
    [routes, path]
  );

  const methodOptions = selected?.methods?.length
    ? selected.methods
    : (["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const recentPaths = new Set(recent.map((r) => r.path));
    const scored = routes
      .map((route) => {
        const hay = `${route.group} ${route.path} ${route.methods.join(" ")} ${route.description || ""}`.toLowerCase();
        const match = !q || hay.includes(q);
        const recentBoost = recentPaths.has(route.path) ? 0 : 1;
        return { route, match, recentBoost };
      })
      .filter((x) => x.match)
      .sort((a, b) => {
        if (a.recentBoost !== b.recentBoost) return a.recentBoost - b.recentBoost;
        return (
          a.route.group.localeCompare(b.route.group) ||
          a.route.path.localeCompare(b.route.path)
        );
      })
      .slice(0, 50);
    return scored.map((s) => s.route);
  }, [query, recent, routes]);

  function pick(route: CatalogRoute) {
    const nextMethod = route.methods.includes(method)
      ? method
      : route.methods[0] || "GET";
    onPickRoute(route, nextMethod);
    setQuery(route.path);
    setOpen(false);
    setRecent(loadRecentEndpoints());
  }

  return (
    <div ref={rootRef} className="relative space-y-3">
      <div className="grid gap-3 sm:grid-cols-[7.5rem_1fr]">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
            Method
          </span>
          <select
            className={adminInputClass}
            value={method}
            onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          >
            {methodOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
            Endpoint
          </span>
          <input
            className={cn(adminInputClass, "font-mono text-xs")}
            value={query}
            placeholder="/api/…"
            autoComplete="off"
            onFocus={() => {
              setRecent(loadRecentEndpoints());
              setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              onPathChange(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </label>
      </div>

      {selected ? (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
          <span className="text-white/70">{selected.group}</span>
          {" · "}
          <span className="font-mono">{selected.authentication}</span>
          {selected.permissions.length > 0
            ? ` · ${selected.permissions.join(", ")}`
            : ""}
          {selected.description ? (
            <p className="mt-1 text-white/45">{selected.description}</p>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-80 overflow-auto rounded-xl border border-white/10 bg-[#121214] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
          {suggestions.length === 0 ? (
            <p className="px-3 py-4 text-xs text-white/40">
              No discovered matches. Custom paths are checked against the live
              catalog before execute.
            </p>
          ) : (
            <ul className="py-1">
              {suggestions.map((route) => (
                <li key={route.path}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-white/[0.05]"
                    onClick={() => pick(route)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex flex-wrap gap-1">
                        {route.methods.map((m) => (
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
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/80">
                        {route.path}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/35">
                        {route.group}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
