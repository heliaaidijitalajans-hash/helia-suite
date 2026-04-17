import { AIHome } from "@/components/ai/AIHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helia AI Demo",
  description: "AI business assistant demo — chat, features, and static responses.",
};

export default function DemoAiPage() {
  return <AIHome />;
}
