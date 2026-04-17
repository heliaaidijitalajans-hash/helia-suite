import { DemoHubClient } from "@/components/DemoHubClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build AI-Powered Mobile App Systems",
  description:
    "Marketplace, Education, Fitness and more — all powered by AI. Explore Helia demos in one hub.",
};

export default function DemoHubPage() {
  return <DemoHubClient />;
}
