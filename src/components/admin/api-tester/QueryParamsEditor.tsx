"use client";

import { Plus, Trash2 } from "lucide-react";
import { adminBtnSecondary, adminInputClass } from "@/components/admin/ui";
import type { QueryParam } from "./types";

function nid() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function QueryParamsEditor({
  params,
  onChange,
}: {
  params: QueryParam[];
  onChange: (next: QueryParam[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Query parameters
        </p>
        <button
          type="button"
          className={adminBtnSecondary}
          onClick={() =>
            onChange([
              ...params,
              { id: nid(), key: "", value: "", enabled: true },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {params.length === 0 ? (
        <p className="text-xs text-white/40">
          Optional — e.g. limit=20, page=1, sort=name
        </p>
      ) : (
        <ul className="space-y-2">
          {params.map((p, idx) => (
            <li key={p.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => {
                  const next = [...params];
                  next[idx] = { ...p, enabled: e.target.checked };
                  onChange(next);
                }}
                className="h-4 w-4 accent-[var(--accent,#d4af37)]"
                aria-label="Include parameter"
              />
              <input
                className={adminInputClass}
                placeholder="key"
                value={p.key}
                onChange={(e) => {
                  const next = [...params];
                  next[idx] = { ...p, key: e.target.value };
                  onChange(next);
                }}
              />
              <input
                className={adminInputClass}
                placeholder="value"
                value={p.value}
                onChange={(e) => {
                  const next = [...params];
                  next[idx] = { ...p, value: e.target.value };
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-200"
                aria-label="Remove parameter"
                onClick={() => onChange(params.filter((x) => x.id !== p.id))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
