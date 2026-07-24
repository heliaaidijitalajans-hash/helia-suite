import { redirect } from "next/navigation";

/** Projects UI removed — users never manage projects. Backend model remains. */
export default function LegacyProjectsRedirect() {
  redirect("/dashboard/api-keys");
}
