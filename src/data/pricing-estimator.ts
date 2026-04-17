export type PricingEstimatorOption = {
  id: string;
  min: number;
  max: number;
  labelEn: string;
  labelTr: string;
};

/**
 * Reference ranges for the landing-page estimator (USD).
 * Values are fixed per product brief — not a binding quote.
 */
export const PRICING_ESTIMATOR_OPTIONS: PricingEstimatorOption[] = [
  {
    id: "ecommerce",
    min: 32_000,
    max: 36_800,
    labelEn: "E-commerce & Marketplace",
    labelTr: "E-ticaret ve pazar yeri",
  },
  {
    id: "health-fitness",
    min: 35_000,
    max: 42_400,
    labelEn: "Health & Fitness",
    labelTr: "Sağlık ve fitness",
  },
  {
    id: "education-learning",
    min: 28_400,
    max: 32_100,
    labelEn: "Education & Learning",
    labelTr: "Eğitim ve öğrenme",
  },
  {
    id: "productivity",
    min: 24_200,
    max: 31_400,
    labelEn: "Productivity & Task Apps",
    labelTr: "Verimlilik ve görev uygulamaları",
  },
  {
    id: "ar",
    min: 48_700,
    max: 53_000,
    labelEn: "AR (Augmented Reality)",
    labelTr: "AR (Artırılmış gerçeklik)",
  },
  {
    id: "personal-ai",
    min: 40_000,
    max: 46_000,
    labelEn: "Personal AI Assistant",
    labelTr: "Kişisel yapay zekâ asistanı",
  },
  {
    id: "therapy-chatbot",
    min: 29_800,
    max: 34_000,
    labelEn: "Therapy Chatbot",
    labelTr: "Terapi sohbet botu",
  },
  {
    id: "support-ai",
    min: 19_500,
    max: 23_900,
    labelEn: "Customer Support AI",
    labelTr: "Müşteri destek yapay zekâsı",
  },
  {
    id: "content-reco",
    min: 22_300,
    max: 28_800,
    labelEn: "Content & Recommendation Systems",
    labelTr: "İçerik ve öneri sistemleri",
  },
  {
    id: "ai-education",
    min: 43_600,
    max: 54_200,
    labelEn: "AI Education Systems",
    labelTr: "Yapay zekâ eğitim sistemleri",
  },
  {
    id: "visual-ai",
    min: 116_000,
    max: 130_000,
    labelEn: "Visual AI",
    labelTr: "Görsel yapay zekâ",
  },
  {
    id: "music-ai",
    min: 146_000,
    max: 156_000,
    labelEn: "Music AI",
    labelTr: "Müzik yapay zekâsı",
  },
];

export function formatUsdRange(min: number, max: number): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `${fmt.format(min)} – ${fmt.format(max)}`;
}
