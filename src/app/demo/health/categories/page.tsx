import { HealthCategoriesView } from "@/components/health/CategoriesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
  description: "Strength, Cardio, Yoga, and Fat Loss on Helia Health (demo).",
};

export default function DemoHealthCategoriesPage() {
  return <HealthCategoriesView />;
}

