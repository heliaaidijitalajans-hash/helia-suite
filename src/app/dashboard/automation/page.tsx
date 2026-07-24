import { redirect } from "next/navigation";

/** Removed fake automation template — redirect to Helia Platform overview. */
export default function LegacyAutomationRedirect() {
  redirect("/dashboard");
}
