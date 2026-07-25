"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { adminInputClass } from "@/components/admin/ui";
import {
  PREDEFINED_ENDPOINTS,
  endpointKey,
  type EndpointDef,
  type HttpMethod,
} from "./types";
import { loadRecentEndpoints } from "./storage";

export function EndpointCombobox({
  method,
  path,
  onMethodChange,
  onPathChange,
  onPick,
}: {
  method: HttpMethod;
  path: string;
  onMethodChange: (m: HttpMethod) => void;
  onPathChange: (p: string) => void;
  onPick?: (item: EndpointDef) => void;
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

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const recentDefs: EndpointDef[] = recent.map((r) => ({
      method: r.method,
      path: r.path,
      group: "Recent",
    }));

    const catalog = [...recentDefs, ...PREDEFINED_ENDPOINTS];
    const seen = new Set<string>();
    const filtered = catalog.filter((item) => {
      const key = endpointKey(item.method, item.path);
      if (seen.has(key)) return false;
      seen.add(key);
      if (!q) return true;
      return (
        item.path.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        key.toLowerCase().includes(q)
      );
    });
    return filtered.slice(0, 40);
  }, [query, recent]);

  function pick(item: EndpointDef) {
    onMethodChange(item.method);
    onPathChange(item.path);
    setQuery(item.path);
    setOpen(false);
    onPick?.(item);
    setRecent(loadRecentEndpoints());
  }

  return (
    <div ref={rootRef} className="relative grid gap-3 sm:grid-cols-[7.5rem_1fr]">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Method
        </span>
        <select
          className={adminInputClass}
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        >
          {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
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
          placeholder="/api/apikeys/whoami"
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
            if (e.key === "ArrowDown") setOpen(true);
          }}
        />
      </label>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#121214] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
          {suggestions.length === 0 ? (
            <p className="px-3 py-4 text-xs text-white/40">
              No matches — keep typing a custom path under /api/…
            </p>
          ) : (
            <ul className="py-1">
              {suggestions.map((item) => (
                <li key={endpointKey(item.method, item.path) + item.group}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-white/[0.05]"
                    onClick={() => pick(item)}
                  >
                    <span
                      className={cn(
                        "w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center font-semibold",
                        item.method === "GET" && "bg-emerald-500/15 text-emerald-200",
                        item.method === "POST" && "bg-sky-500/15 text-sky-200",
                        item.method === "PUT" && "bg-amber-500/15 text-amber-200",
                        item.method === "PATCH" && "bg-violet-500/15 text-violet-200",
                        item.method === "DELETE" && "bg-red-500/15 text-red-200"
                      )}
                    >
                      {item.method}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-white/80">
                      {item.path}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/35">
                      {item.group}
                    </span>
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
