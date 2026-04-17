import { AIHome } from "@/components/ai/AIHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Helia AI — your business assistant (demo).",
};

export default function DemoAiShopPage() {
  return <AIHome />;
}
