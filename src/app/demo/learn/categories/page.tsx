import { CategoriesView } from "@/components/learn/CategoriesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Design, AI, and Business tracks on Helia Learn.",
};

export default function DemoLearnCategoriesPage() {
  return <CategoriesView />;
}
