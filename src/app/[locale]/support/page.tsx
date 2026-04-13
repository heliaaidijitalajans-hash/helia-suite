import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/Button";
import { isLocale } from "@/config/i18n";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  WHATSAPP_URL,
} from "@/config/site";
import { getDictionary } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.support.title,
    description: dict.support.subtitle,
  };
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  const s = dict.support;

  return (
    <MotionSection className="container-main py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {s.title}
        </h1>
        <p className="mt-4 text-lg text-white/60">{s.subtitle}</p>
      </div>
      <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#161618] p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {s.emailLabel}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 block break-all text-lg font-medium text-foreground transition-colors duration-300 hover:text-accent"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161618] p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {s.phoneLabel}
          </p>
          <a
            href={CONTACT_PHONE_TEL}
            className="mt-3 block text-lg font-medium text-foreground transition-colors duration-300 hover:text-accent"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161618] p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)] sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {s.whatsappLabel}
          </p>
          <Button
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="mt-5 min-h-12 w-full sm:w-auto"
          >
            {s.whatsappLabel}
          </Button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161618] p-8 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {s.responseTitle}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            {s.responseBody}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161618] p-8 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {s.postTitle}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            {s.postBody}
          </p>
        </div>
      </div>
    </MotionSection>
  );
}
