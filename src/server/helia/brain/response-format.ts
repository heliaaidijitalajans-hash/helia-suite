/**
 * Official-style sectioned responses for Helia Administrator.
 */

export function formatAdminSections(input: {
  status?: string;
  summary: string;
  recommendation?: string;
  nextStep?: string;
  extraSections?: Array<{ title: string; body: string }>;
}): string {
  const parts: string[] = [];
  if (input.status?.trim()) {
    parts.push(`Status\n${input.status.trim()}`);
  }
  parts.push(`Summary\n${input.summary.trim()}`);
  for (const section of input.extraSections ?? []) {
    if (section.body.trim()) {
      parts.push(`${section.title}\n${section.body.trim()}`);
    }
  }
  if (input.recommendation?.trim()) {
    parts.push(`Recommendation\n${input.recommendation.trim()}`);
  }
  if (input.nextStep?.trim()) {
    parts.push(`Next Step\n${input.nextStep.trim()}`);
  }
  return parts.join("\n\n");
}
