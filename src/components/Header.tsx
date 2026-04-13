import Link from "next/link";
import { SITE_NAME, WHATSAPP_URL } from "@/config/site";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/config/i18n";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const links = [
  { key: "home" as const, path: "" },
  { key: "pricing" as const, path: "pricing" },
  { key: "about" as const, path: "about" },
  { key: "support" as const, path: "support" },
  { key: "faq" as const, path: "faq" },
];

export function Header({
  locale,
  dict,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const prefix = `/${locale}`;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="container-main flex h-16 items-center justify-between gap-6 md:h-20">
        <Link
          href={prefix}
          className="text-sm font-semibold tracking-tight text-foreground md:text-base"
        >
          {SITE_NAME}
        </Link>
        <nav
          className="flex max-w-[52vw] flex-1 justify-end gap-4 overflow-x-auto text-xs text-white/60 [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none sm:flex-none sm:justify-center sm:gap-8 sm:text-sm md:flex-1 [&::-webkit-scrollbar]:hidden"
          aria-label="Primary"
        >
          {links.map(({ key, path }) => (
            <Link
              key={key}
              href={path ? `${prefix}/${path}` : prefix}
              className="shrink-0 transition-colors hover:text-foreground"
            >
              {dict.nav[key]}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="shrink-0 text-white/45 transition-colors hover:text-foreground"
          >
            {dict.nav.demo}
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Button
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="px-4 py-2 text-xs md:px-5 md:text-sm"
          >
            {dict.header.whatsappCta}
          </Button>
        </div>
      </div>
    </header>
  );
}
