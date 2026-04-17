import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { isLocale, type Locale } from "@/config/i18n";
import {
  demoLocalizedDescription,
  demoLocalizedTitle,
  isInteractiveEmbed,
  listCustomerDemos,
} from "@/lib/customer-demos";
import { getDictionary } from "@/lib/i18n";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.demos.pageTitle,
    description: dict.demos.pageSubtitle,
  };
}

export default async function DemosIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const L = locale as Locale;
  const items = listCustomerDemos();
  const d = dict.demos;
  const p = `/${locale}`;

  return (
    <MotionSection className="container-main py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {d.pageTitle}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-white/60">
          {d.pageSubtitle}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm text-white/45">
          {d.fullDemoHubHint}{" "}
          <Link
            href="/demo"
            className="font-medium text-accent/90 underline-offset-4 hover:underline"
          >
            {d.fullDemoHubLink}
          </Link>
          .
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-white/10 bg-surface/50 px-8 py-12 text-center">
          <p className="text-lg font-medium text-white">{d.emptyTitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {d.emptyBody}
          </p>
        </div>
      ) : (
        <ul className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={`${p}/demos/${item.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-[#161618]/90 p-7 text-left shadow-[0_20px_50px_-28px_rgba(0,0,0,0.75)] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_24px_60px_-24px_rgba(212,175,55,0.1)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {item.slug}
                  </span>
                  {isInteractiveEmbed(item) ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/95">
                      {d.interactiveBadge}
                    </span>
                  ) : null}
                </div>
                <span className="mt-3 text-xl font-semibold tracking-tight text-white group-hover:text-white">
                  {demoLocalizedTitle(item, L)}
                </span>
                <span className="mt-3 flex-1 text-sm leading-relaxed text-white/55">
                  {demoLocalizedDescription(item, L)}
                </span>
                <span className="mt-6 text-sm font-medium text-accent/95">
                  {d.viewDemo} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MotionSection>
  );
}
