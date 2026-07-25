/**
 * Normalize process.env values.
 * Some dotenv / panel setups keep surrounding quotes as part of the value.
 */

export function cleanEnvValue(value: string | undefined | null): string {
  let v = (value ?? "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}
