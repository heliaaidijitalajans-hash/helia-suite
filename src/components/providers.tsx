"use client";

import { CartProvider } from "@/providers/cart-provider";
import { CatalogProvider } from "@/providers/catalog-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>{children}</CartProvider>
    </CatalogProvider>
  );
}
