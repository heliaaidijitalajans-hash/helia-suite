import { MarketHome } from "@/components/MarketHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Helia Market — trending and recommended rails from a static demo catalog.",
};

export default function DemoShopPage() {
  return <MarketHome />;
}

