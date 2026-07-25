"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Shows a 403 notice when redirected from /admin without admin role. */
export function AdminForbiddenBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(searchParams.get("forbidden") === "admin");
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div
      className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50/95"
      role="alert"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">403 — Admin access required</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
            Your account does not have{" "}
            <code className="text-amber-100">role=&quot;admin&quot;</code>. The
            customer API Platform remains available. Ask an operator to add your
            email to{" "}
            <code className="text-amber-100">HELIA_ADMIN_EMAILS</code>, or use
            bootstrap promote in development.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-50/90 hover:bg-amber-500/15"
          onClick={() => {
            setVisible(false);
            router.replace(pathname);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
