"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { defaultLocale, isLocale, type Locale } from "@/config/i18n";

const options: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

/**
 * Language switch without breaking dashboard routes.
 * Dashboard stays on /dashboard/* (no /en/api-keys or /tr/profile).
 * Public pages switch /en/pricing ↔ /tr/pricing.
 */
export function languageSwitchHref(
  pathname: string,
  targetLocale: Locale
): string {
  const segments = pathname.split("/").filter(Boolean);

  // Keep platform routes unlocalized — prevents 404s from missing locale pages.
  if (segments[0] === "dashboard") {
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }

  const currentLocale =
    segments[0] && isLocale(segments[0]) ? segments[0] : null;
  const rest = currentLocale ? segments.slice(1) : segments;
  const tail = rest.join("/");
  return tail ? `/${targetLocale}/${tail}` : `/${targetLocale}`;
}

function activeLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) return segments[0];
  return defaultLocale;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = activeLocaleFromPath(pathname);
  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

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
        const href = languageSwitchHref(pathname, code);
        return (
          <Link
            key={code}
            href={href}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              (!onDashboard && active === code) || (onDashboard && code === defaultLocale)
                ? "bg-white/10 text-foreground"
                : "text-white/50 hover:text-white/80",
              onDashboard && code !== defaultLocale ? "opacity-60" : ""
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
