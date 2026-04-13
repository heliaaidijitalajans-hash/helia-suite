import { MotionSection } from "@/components/MotionSection";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/config/i18n";

export function PricingPreview({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const h = dict.home;
  const p = `/${locale}`;

  return (
    <MotionSection className="container-main py-20 md:py-28">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {h.pricingTeaser}
        </h2>
        <Button
          href={`${p}/pricing`}
          variant="primary"
          className="mt-10 min-h-12 px-8 text-sm font-medium"
        >
          {h.requestPricingCta}
        </Button>
      </div>
    </MotionSection>
  );
}
