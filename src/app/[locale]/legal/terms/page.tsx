import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDoc } from "@/components/LegalDoc";
import { MotionSection } from "@/components/MotionSection";
import { isLocale } from "@/config/i18n";
import { getDictionary } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.legal.terms.title,
    description: dict.footer.terms,
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const L = dict.legal;
  const doc = L.terms;

  return (
    <MotionSection>
      <LegalDoc
        title={doc.title}
        lastUpdated={L.lastUpdated}
        identityHeading={L.identityHeading}
        identityLines={L.identityLines}
        blocks={doc.blocks}
        closingLines={L.closingLines}
      />
    </MotionSection>
  );
}
