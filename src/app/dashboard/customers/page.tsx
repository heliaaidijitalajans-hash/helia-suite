import { redirect } from "next/navigation";

/** Removed CRM placeholder — redirect to Helia Platform overview. */
export default function LegacyCustomersRedirect() {
  redirect("/dashboard");
}
