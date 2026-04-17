import { AIToolsView } from "@/components/ai/AIToolsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools",
  description: "Helia AI tools — copywriter, sales, ideas, and email (static demo).",
};

export default function DemoAiToolsPage() {
  return <AIToolsView />;
}
