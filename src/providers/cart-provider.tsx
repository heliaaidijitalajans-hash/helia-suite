"use client";

import type { Product } from "@/data/products";
import { useCatalog } from "@/providers/catalog-provider";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLineItem = { product: Product; quantity: number };

type CartContextValue = {
  lineItems: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { getProductById } = useCatalog();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const addItem = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) return;
    setQtyById((prev) => ({
      ...prev,
      [productId]: (prev[productId] ?? 0) + quantity,
    }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setQtyById((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }, []);

  const clear = useCallback(() => setQtyById({}), []);

  const lineItems = useMemo(() => {
    const rows: CartLineItem[] = [];
    for (const [id, quantity] of Object.entries(qtyById)) {
      const product = getProductById(id);
      if (product) rows.push({ product, quantity });
    }
    return rows;
  }, [qtyById, getProductById]);

  const itemCount = useMemo(
    () => lineItems.reduce((sum, row) => sum + row.quantity, 0),
    [lineItems]
  );

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, row) => sum + row.product.price * row.quantity,
        0
      ),
    [lineItems]
  );

  const value = useMemo(
    () => ({
      lineItems,
      itemCount,
      subtotal,
      addItem,
      setQuantity,
      clear,
    }),
    [lineItems, itemCount, subtotal, addItem, setQuantity, clear]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
