import { LearnAdminView } from "@/components/learn/LearnAdminView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hub",
  description: "Instructor hub — simulated analytics for Helia Learn.",
};

export default function DemoLearnAdminPage() {
  return <LearnAdminView />;
}
