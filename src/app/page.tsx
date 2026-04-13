import { defaultLocale } from "@/config/i18n";
import { redirect } from "next/navigation";

/**
 * `/` isteği middleware tarafından `/${defaultLocale}` adresine yönlendirilir.
 * Bu dosya, yönlendirme olmayan ortamlarda da tutarlı davranış sağlar.
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
