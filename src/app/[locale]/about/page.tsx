import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { isLocale } from "@/config/i18n";
import { CONTACT_EMAIL } from "@/config/site";
import { getDictionary } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.nav.about,
    description: dict.about.lead,
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const a = dict.about;

  return (
    <MotionSection className="container-main py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {a.title}
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-white/70">{a.lead}</p>
        <div className="mt-12 space-y-6 text-base leading-relaxed text-white/60">
          <p>{a.p1}</p>
          <p>{a.p2}</p>
          <p>{a.p3}</p>
        </div>
        <p className="mt-14 text-sm text-white/45">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </MotionSection>
  );
}
