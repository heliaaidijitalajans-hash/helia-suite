import Link from "next/link";
import {
  COMPANY_TAX_ID,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  SITE_NAME,
} from "@/config/site";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/config/i18n";
import { cn } from "@/lib/cn";

export function Footer({
  locale,
  dict,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const p = `/${locale}`;

  const explore = [
    { href: p, label: dict.nav.home },
    { href: `${p}/pricing`, label: dict.nav.pricing },
    { href: `${p}/about`, label: dict.nav.about },
    { href: `${p}/support`, label: dict.nav.support },
    { href: `${p}/faq`, label: dict.nav.faq },
    { href: "/dashboard", label: dict.nav.demo },
  ];

  const legal = [
    { href: `${p}/legal/privacy`, label: dict.footer.privacy },
    { href: `${p}/legal/terms`, label: dict.footer.terms },
    { href: `${p}/legal/cookies`, label: dict.footer.cookies },
    { href: `${p}/legal/kvkk`, label: dict.footer.kvkk },
  ];

  const trust = [
    dict.footer.trustResponse,
    dict.footer.trustCustom,
    dict.footer.trustNoFees,
  ];

  return (
    <footer
      className={cn(
        "mt-auto border-t border-white/10 bg-surface/35",
        className
      )}
    >
      <div className="container-main py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-5 lg:col-span-4">
            <Link
              href={p}
              className="inline-block text-lg font-semibold tracking-tight text-foreground transition-opacity duration-300 hover:opacity-90"
            >
              {SITE_NAME}
            </Link>
            <p className="text-sm leading-relaxed text-white/55">
              {dict.footer.tagline}
            </p>
            <ul
              className="flex flex-col gap-2 text-xs text-white/50 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2"
              aria-label="Trust"
            >
              {trust.map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <nav
            className="lg:col-span-2"
            aria-label={dict.footer.explore}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              {dict.footer.explore}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block py-0.5 transition-colors duration-300 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-3" aria-label={dict.footer.legal}>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              {dict.footer.legal}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block py-0.5 transition-colors duration-300 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              {dict.footer.companyHeading}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block break-all text-foreground/90 underline-offset-4 transition-colors duration-300 hover:text-accent hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_PHONE_TEL}
                  className="block text-foreground/90 underline-offset-4 transition-colors duration-300 hover:text-accent hover:underline"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li className="text-xs leading-relaxed text-white/50">
                {dict.footer.taxIdLabel}: {COMPANY_TAX_ID}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <p className="container-main text-center text-xs leading-relaxed text-white/45">
          © {new Date().getFullYear()} {SITE_NAME}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
