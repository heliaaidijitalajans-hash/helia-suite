"use client";

import { cn } from "@/lib/cn";

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/45">{description}</p>
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)]",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-white/45">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export const adminInputClass =
  "w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/40";

export const adminBtnPrimary =
  "inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:brightness-110 disabled:opacity-50";

export const adminBtnSecondary =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-50";

export const adminBtnDanger =
  "inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-100/90 transition-colors hover:bg-red-500/20 disabled:opacity-50";
