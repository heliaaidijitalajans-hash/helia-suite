export type AiBadgeTone = "violet" | "sky" | "amber" | "emerald";

export const aiBadgeToneClasses: Record<
  AiBadgeTone,
  { chip: string; glow: string }
> = {
  violet: {
    chip: "border-violet-200/70 bg-violet-50/90 text-violet-900",
    glow: "shadow-[0_10px_26px_-14px_rgba(124,58,237,0.45)]",
  },
  sky: {
    chip: "border-sky-200/70 bg-sky-50/90 text-sky-900",
    glow: "shadow-[0_10px_26px_-14px_rgba(14,165,233,0.35)]",
  },
  amber: {
    chip: "border-amber-200/70 bg-amber-50/90 text-amber-950",
    glow: "shadow-[0_10px_26px_-14px_rgba(245,158,11,0.4)]",
  },
  emerald: {
    chip: "border-emerald-200/70 bg-emerald-50/90 text-emerald-950",
    glow: "shadow-[0_10px_26px_-14px_rgba(16,185,129,0.35)]",
  },
};

const LABELS: { label: string; tone: AiBadgeTone }[] = [
  { label: "Sense · Top match", tone: "violet" },
  { label: "Sense · Rising", tone: "sky" },
  { label: "Sense · Bundle fit", tone: "amber" },
  { label: "Sense · Loyalty pick", tone: "emerald" },
];

function hashProductId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getAiProductBadge(productId: string): {
  label: string;
  tone: AiBadgeTone;
} {
  const pick = LABELS[hashProductId(productId) % LABELS.length];
  return pick;
}
