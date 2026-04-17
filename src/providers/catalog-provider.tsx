"use client";

import type { Product } from "@/data/products";
import {
  getSimilarProductsFromList,
  products as seedProducts,
  SEED_PRODUCT_IDS,
} from "@/data/products";
import type { Store } from "@/data/stores";
import { stores as seedStores } from "@/data/stores";
import { SEED_STORE_IDS } from "@/data/stores";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AddProductInput = {
  name: string;
  price: number;
  storeId: string;
  category: string;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  image?: string;
};

type AddStoreInput = {
  name: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  logo?: string;
};

type CatalogContextValue = {
  products: Product[];
  stores: Store[];
  getProductById: (id: string) => Product | undefined;
  getSimilarProducts: (productId: string, limit?: number) => Product[];
  getStoreName: (storeId: string) => string;
  getStoreById: (id: string) => Store | undefined;
  getProductsByStoreId: (storeId: string) => Product[];
  addProduct: (input: AddProductInput) => void;
  addStore: (input: AddStoreInput) => void;
  extraProductCount: number;
  extraStoreCount: number;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(
  undefined
);

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

function newProductId() {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newStoreId(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `${base || "store"}-${Math.random().toString(36).slice(2, 6)}`;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => [...seedProducts]);
  const [stores, setStores] = useState<Store[]>(() => [...seedStores]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getSimilarProducts = useCallback(
    (productId: string, limit = 3) =>
      getSimilarProductsFromList(products, productId, limit),
    [products]
  );

  const getStoreName = useCallback(
    (storeId: string) =>
      stores.find((s) => s.id === storeId)?.name ?? "Helia Market",
    [stores]
  );

  const getStoreById = useCallback(
    (id: string) => stores.find((s) => s.id === id),
    [stores]
  );

  const getProductsByStoreId = useCallback(
    (storeId: string) => products.filter((p) => p.storeId === storeId),
    [products]
  );

  const addProduct = useCallback((input: AddProductInput) => {
    const next: Product = {
      id: newProductId(),
      name: input.name,
      price: input.price,
      storeId: input.storeId,
      category: input.category,
      image: input.image?.trim() || PLACEHOLDER_IMG,
      isRecommended: input.isRecommended,
      isTrending: input.isTrending,
      isBestSeller: input.isBestSeller,
    };
    setProducts((prev) => [...prev, next]);
  }, []);

  const addStore = useCallback((input: AddStoreInput) => {
    const next: Store = {
      id: newStoreId(input.name),
      name: input.name,
      tagline: input.tagline,
      rating: input.rating,
      reviewCount: input.reviewCount,
      logo: input.logo?.trim() || PLACEHOLDER_IMG,
    };
    setStores((prev) => [...prev, next]);
  }, []);

  const extraProductCount = useMemo(
    () => products.filter((p) => !SEED_PRODUCT_IDS.has(p.id)).length,
    [products]
  );

  const extraStoreCount = useMemo(
    () => stores.filter((s) => !SEED_STORE_IDS.has(s.id)).length,
    [stores]
  );

  const value = useMemo(
    () => ({
      products,
      stores,
      getProductById,
      getSimilarProducts,
      getStoreName,
      getStoreById,
      getProductsByStoreId,
      addProduct,
      addStore,
      extraProductCount,
      extraStoreCount,
    }),
    [
      products,
      stores,
      getProductById,
      getSimilarProducts,
      getStoreName,
      getStoreById,
      getProductsByStoreId,
      addProduct,
      addStore,
      extraProductCount,
      extraStoreCount,
    ]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
