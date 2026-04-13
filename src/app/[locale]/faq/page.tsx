import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { isLocale } from "@/config/i18n";
import { getDictionary } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.faq.title,
    description: dict.faq.subtitle,
  };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <MotionSection className="container-main py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {dict.faq.title}
        </h1>
        <p className="mt-4 text-lg text-white/60">{dict.faq.subtitle}</p>
      </div>
      <div className="mx-auto mt-14 max-w-3xl divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface/60 px-6 py-2 md:px-10">
        {dict.faq.items.map((item) => (
          <details
            key={item.q}
            className="group py-6 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-medium tracking-tight">
              {item.q}
              <span className="mt-0.5 shrink-0 text-accent transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{item.a}</p>
          </details>
        ))}
      </div>
    </MotionSection>
  );
}
