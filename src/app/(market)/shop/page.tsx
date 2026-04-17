import { MarketHome } from "@/components/MarketHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Helia Market — AI-Powered App Systems preview: trending rails, best sellers, and AI picks (static demo).",
};

export default function ShopPage() {
  return <MarketHome />;
}
