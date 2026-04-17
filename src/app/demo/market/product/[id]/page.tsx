import { ProductDetailView } from "@/components/ProductDetailView";
import { getProductById } from "@/data/products";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  return {
    title: product?.name ?? "Product",
    description: product
      ? `${product.name} on Helia Market — demo storefront.`
      : "Product on Helia Market.",
  };
}

export default async function DemoProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}

