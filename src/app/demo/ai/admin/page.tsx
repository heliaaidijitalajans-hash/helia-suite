import { AIProfileView } from "@/components/ai/AIProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Helia AI profile — demo account (static).",
};

export default function DemoAiProfilePage() {
  return <AIProfileView />;
}
