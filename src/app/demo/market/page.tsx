import { MarketHome } from "@/components/MarketHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helia Market Demo",
  description:
    "Helia Market — AI-Powered App Systems preview: catalog, recommendations, stores, cart, and admin.",
};

export default function DemoMarketPage() {
  return <MarketHome />;
}

