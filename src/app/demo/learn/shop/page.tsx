import { LearnHome } from "@/components/learn/LearnHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Helia Learn — discover courses and tracks.",
};

export default function DemoLearnShopPage() {
  return <LearnHome />;
}
