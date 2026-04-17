import { CategoryDetailView } from "@/components/learn/CategoryDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Category",
  description: "Courses in this Helia Learn category (demo).",
};

export default async function DemoLearnCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryDetailView categoryId={id} />;
}
