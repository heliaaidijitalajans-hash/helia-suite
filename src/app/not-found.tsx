import Link from "next/link";
import { locales } from "@/config/i18n";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Helia Suite
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        404
      </h1>
      <p className="mt-4 max-w-md text-white/60">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {locales.map((locale) => (
          <Link
            key={locale}
            href={`/${locale}`}
            className="rounded-full border border-white/15 bg-[#161618] px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:border-[#D4AF37]/50"
          >
            {locale === "tr" ? "Türkçe ana sayfa" : "English home"}
          </Link>
        ))}
      </div>
    </div>
  );
}
