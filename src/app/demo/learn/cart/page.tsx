import { LearnCartView } from "@/components/learn/LearnCartView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved",
  description: "Saved courses on Helia Learn (demo).",
};

export default function DemoLearnCartPage() {
  return <LearnCartView />;
}
