import { HealthSavedView } from "@/components/health/SavedView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved",
  description: "Saved workouts on Helia Health (demo).",
};

export default function DemoHealthSavedPage() {
  return <HealthSavedView />;
}

