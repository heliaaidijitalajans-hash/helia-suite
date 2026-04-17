import { LearnHome } from "@/components/learn/LearnHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helia Learn Demo",
  description: "Education app demo — popular courses, categories, and static catalog.",
};

export default function DemoLearnPage() {
  return <LearnHome />;
}
