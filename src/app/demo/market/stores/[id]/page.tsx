import { StoreDetailView } from "@/components/StoreDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description: "Storefront and products on Helia Market (demo).",
};

export default async function DemoStoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StoreDetailView storeId={id} />;
}

