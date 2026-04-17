import { HealthHome } from "@/components/health/HealthHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helia Health Demo",
  description: "Fitness & wellness demo — AI recommendations, daily plan, and coaching hub.",
};

export default function DemoHealthPage() {
  return <HealthHome />;
}

