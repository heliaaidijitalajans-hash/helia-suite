"use client";

import { adminInputClass } from "@/components/admin/ui";
import type { PathParam } from "./types";

export function PathParamsEditor({
  params,
  onChange,
}: {
  params: PathParam[];
  onChange: (next: PathParam[]) => void;
}) {
  if (params.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
        Path parameters
      </p>
      <ul className="space-y-2">
        {params.map((p, idx) => (
          <li key={p.id} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <span className="rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 font-mono text-xs text-accent/90">
              :{p.key}
            </span>
            <input
              className={adminInputClass}
              placeholder={`value for ${p.key}`}
              value={p.value}
              onChange={(e) => {
                const next = [...params];
                next[idx] = { ...p, value: e.target.value };
                onChange(next);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
