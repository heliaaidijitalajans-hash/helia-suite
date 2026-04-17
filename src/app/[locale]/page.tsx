import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { CTASection } from "@/sections/CTASection";
import { Hero } from "@/sections/Hero";
import { HowItWorks } from "@/sections/HowItWorks";
import { PricingEstimatorSection } from "@/sections/PricingEstimatorSection";
import { PricingPreview } from "@/sections/PricingPreview";
import { ServicesBento } from "@/sections/ServicesBento";
import { SocialProof } from "@/sections/SocialProof";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/config/i18n";
import { SITE_NAME } from "@/config/site";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.seo.defaultTitle,
    description: dict.seo.defaultDescription,
    openGraph: {
      title: dict.seo.defaultTitle,
      description: dict.seo.defaultDescription,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <SocialProof dict={dict} />
      <ServicesBento dict={dict} />
      <HowItWorks dict={dict} />
      <PricingEstimatorSection locale={locale} dict={dict} />
      <PricingPreview locale={locale} dict={dict} />
      <CTASection locale={locale} dict={dict} />
      <section
        id="lead-demo"
        className="container-main flex scroll-mt-24 justify-center px-4 pb-28 pt-6 md:scroll-mt-28 md:pb-36 md:pt-10"
        aria-labelledby="lead-form-heading"
      >
        <LeadForm dict={dict} />
      </section>
    </>
  );
}
