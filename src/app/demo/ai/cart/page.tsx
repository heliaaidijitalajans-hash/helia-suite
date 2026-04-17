import { AIHistoryView } from "@/components/ai/AIHistoryView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description: "Helia AI recent activity (demo).",
};

export default function DemoAiHistoryPage() {
  return <AIHistoryView />;
}
