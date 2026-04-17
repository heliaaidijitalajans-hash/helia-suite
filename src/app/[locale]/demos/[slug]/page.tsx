import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { isLocale } from "@/config/i18n";
import type { Locale } from "@/config/i18n";
import {
  customerDemoIndexUrl,
  demoLocalizedDescription,
  demoLocalizedTitle,
  getCustomerDemo,
  listCustomerDemos,
} from "@/lib/customer-demos";
import { getDictionary } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = true;

export function generateStaticParams() {
  return listCustomerDemos().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDictionary(locale);
  const entry = getCustomerDemo(slug);
  if (!entry) {
    return { title: dict.demos.notFoundTitle };
  }
  const L = isLocale(locale) ? (locale as Locale) : "en";
  return {
    title: demoLocalizedTitle(entry, L),
    description: demoLocalizedDescription(entry, L),
  };
}

export default async function DemoPreviewPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const entry = getCustomerDemo(slug);
  if (!entry) notFound();

  const dict = getDictionary(locale);
  const L = locale as Locale;
  const d = dict.demos;
  const p = `/${locale}`;
  const src = customerDemoIndexUrl(entry.slug);
  const title = demoLocalizedTitle(entry, L);

  return (
    <MotionSection className="container-main py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href={`${p}/demos`}
              className="text-sm font-medium text-accent/90 underline-offset-4 hover:underline"
            >
              ← {d.backToList}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
              {demoLocalizedDescription(entry, L)}
            </p>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 transition-colors hover:border-accent/35 hover:text-white"
          >
            {d.openInNewTab}
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-white/40 md:text-left">
          {d.iframeHelp}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0f] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
          <iframe
            title={title}
            src={src}
            className="h-[min(78vh,820px)] w-full border-0 bg-[#0a0a0b]"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          />
        </div>
      </div>
    </MotionSection>
  );
}
