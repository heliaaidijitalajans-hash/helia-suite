import { redirect } from "next/navigation";

/**
 * Helia Chat is not part of the customer API dashboard.
 * Implementation remains under components/chat, hooks/useHeliaChat,
 * services/brain, and /api/brain/* for the future Helia Admin Console.
 */
export default function HeliaChatCustomerRedirect() {
  redirect("/dashboard");
}
