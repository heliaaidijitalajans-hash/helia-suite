import { CartView } from "@/components/CartView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your Helia Market demo bag.",
};

export default function DemoCartPage() {
  return <CartView />;
}

