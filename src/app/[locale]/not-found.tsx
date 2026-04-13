"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { isLocale } from "@/config/i18n";

const copy = {
  en: {
    title: "Page not found",
    body: "This page doesn’t exist or the link may be outdated.",
    home: "Back to home",
  },
  tr: {
    title: "Sayfa bulunamadı",
    body: "Bu sayfa mevcut değil veya bağlantı güncel olmayabilir.",
    home: "Ana sayfaya dön",
  },
} as const;

export default function LocaleNotFound() {
  const params = useParams();
  const raw = params?.locale;
  const locale =
    typeof raw === "string" && isLocale(raw) ? raw : ("en" as const);
  const t = copy[locale];

  return (
    <div className="container-main flex min-h-[55vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
        {t.title}
      </h1>
      <p className="mt-4 max-w-md text-white/60">{t.body}</p>
      <Link
        href={`/${locale}`}
        className="mt-10 rounded-full bg-accent px-6 py-3 text-sm font-medium text-[#0A0A0B] transition hover:brightness-110"
      >
        {t.home}
      </Link>
    </div>
  );
}
