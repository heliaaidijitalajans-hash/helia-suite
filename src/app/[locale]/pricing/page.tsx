import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/Button";
import { isLocale } from "@/config/i18n";
import { WHATSAPP_URL } from "@/config/site";
import { getDictionary } from "@/lib/i18n";
import { PricingEstimatorSection } from "@/sections/PricingEstimatorSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.pricing.title,
    description: dict.pricing.subtitle,
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const pr = dict.pricing;
  const trust = [
    dict.footer.trustNoFees,
    dict.footer.trustCustom,
    dict.footer.trustResponse,
  ];
  const p = `/${locale}`;

  return (
    <>
      <MotionSection className="container-main border-b border-white/[0.06] py-14 md:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {pr.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">
            {pr.subtitle}
          </p>
        </div>
      </MotionSection>

      <PricingEstimatorSection locale={locale} dict={dict} />

      <MotionSection className="container-main py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-sm leading-relaxed text-white/45 md:text-base">
            {pr.scopeLine}
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button
              href={`${p}/support`}
              variant="primary"
              className="min-h-12 px-8 text-sm font-medium"
            >
              {dict.nav.contact}
            </Button>
            <Button
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="min-h-12 px-8 text-sm font-medium"
            >
              {pr.whatsappCta}
            </Button>
          </div>

          <ul
            className="mx-auto mt-14 flex max-w-md flex-col gap-3 text-sm text-white/50"
            aria-label="Trust"
          >
            {trust.map((line) => (
              <li
                key={line}
                className="flex items-center justify-center gap-2.5 text-center"
              >
                <span className="shrink-0 text-accent" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </MotionSection>
    </>
  );
}
