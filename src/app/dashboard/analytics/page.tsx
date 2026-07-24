import { redirect } from "next/navigation";

/** Removed fake analytics template — redirect to Helia Platform overview. */
export default function LegacyAnalyticsRedirect() {
  redirect("/dashboard");
}
