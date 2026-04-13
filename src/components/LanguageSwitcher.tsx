"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Locale } from "@/config/i18n";

const options: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");
  const base = rest ? `/${rest}` : "";

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-white/10 bg-surface/80 p-0.5 text-xs font-medium backdrop-blur",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {options.map(({ code, label }) => {
        const href = `/${code}${base}`;
        const active = segments[0] === code;
        return (
          <Link
            key={code}
            href={href}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              active
                ? "bg-white/10 text-foreground"
                : "text-white/50 hover:text-white/80"
            )}
            hrefLang={code}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
