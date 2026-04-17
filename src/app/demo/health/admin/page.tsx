import { HealthHubView } from "@/components/health/HubView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hub",
  description: "Coaching hub — stats and AI insights for Helia Health (demo).",
};

export default function DemoHealthHubPage() {
  return <HealthHubView />;
}

