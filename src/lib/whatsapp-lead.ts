import { WHATSAPP_URL } from "@/config/site";

const MAX_LEN = 1800;

/**
 * Opens WhatsApp with a short context line about where the user tapped from.
 */
export function buildWhatsAppLeadUrl(pathname: string): string {
  const path = pathname.replace(/\s+/g, " ").slice(0, 400);
  const text = encodeURIComponent(
    `Hi Helia Suite — I'm browsing: ${path || "/"}`.slice(0, MAX_LEN)
  );
  const sep = WHATSAPP_URL.includes("?") ? "&" : "?";
  return `${WHATSAPP_URL}${sep}text=${text}`;
}
