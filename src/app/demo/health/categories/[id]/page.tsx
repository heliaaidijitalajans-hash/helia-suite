import { HealthCategoryDetailView } from "@/components/health/CategoryDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Category",
  description: "Workouts in this Helia Health category (demo).",
};

export default async function DemoHealthCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HealthCategoryDetailView categoryId={id} />;
}

