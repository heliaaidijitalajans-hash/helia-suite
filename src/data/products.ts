import { stores } from "./stores";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  storeId: string;
  category: string;
  isRecommended: boolean;
  /** Curated “Trending Now” rail — demo flag, not real analytics. */
  isTrending: boolean;
  /** “Best Sellers” rail — demo flag. */
  isBestSeller: boolean;
};

export const products: Product[] = [
  {
    id: "p-watch",
    name: "Minimal steel watch",
    price: 289,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    storeId: "fashion",
    category: "Accessories",
    isRecommended: true,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-tote",
    name: "Leather weekender",
    price: 329,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    storeId: "fashion",
    category: "Bags",
    isRecommended: true,
    isTrending: true,
    isBestSeller: false,
  },
  {
    id: "p-sun",
    name: "Polarized sunglasses",
    price: 118,
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    storeId: "fashion",
    category: "Accessories",
    isRecommended: false,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-coat",
    name: "Wool wrap coat",
    price: 398,
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80",
    storeId: "fashion",
    category: "Outerwear",
    isRecommended: true,
    isTrending: false,
    isBestSeller: true,
  },
  {
    id: "p-buds",
    name: "Studio headphones",
    price: 199,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    storeId: "tech",
    category: "Audio",
    isRecommended: true,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-cam",
    name: "Mirrorless camera kit",
    price: 1249,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    storeId: "tech",
    category: "Cameras",
    isRecommended: true,
    isTrending: true,
    isBestSeller: false,
  },
  {
    id: "p-key",
    name: "Low-profile keyboard",
    price: 189,
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    storeId: "tech",
    category: "Peripherals",
    isRecommended: false,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-spk",
    name: "Compact smart speaker",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    storeId: "tech",
    category: "Smart home",
    isRecommended: true,
    isTrending: false,
    isBestSeller: true,
  },
  {
    id: "p-kicks",
    name: "Performance sneakers",
    price: 159,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    storeId: "streetwear",
    category: "Footwear",
    isRecommended: true,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-hood",
    name: "Heavyweight hoodie",
    price: 128,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    storeId: "streetwear",
    category: "Tops",
    isRecommended: true,
    isTrending: true,
    isBestSeller: false,
  },
  {
    id: "p-cap",
    name: "Structured 6-panel cap",
    price: 48,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
    storeId: "streetwear",
    category: "Headwear",
    isRecommended: false,
    isTrending: true,
    isBestSeller: true,
  },
  {
    id: "p-shell",
    name: "Technical wind shell",
    price: 214,
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    storeId: "streetwear",
    category: "Outerwear",
    isRecommended: true,
    isTrending: false,
    isBestSeller: true,
  },
];

/** IDs shipped in the static seed catalog (extras are admin-added). */
export const SEED_PRODUCT_IDS = new Set(products.map((p) => p.id));

export const trendingProducts = products.filter((p) => p.isTrending);
export const bestSellerProducts = products.filter((p) => p.isBestSeller);
export const aiPickProducts = products.filter((p) => p.isRecommended);

export function getProductsByStoreId(storeId: string) {
  return products.filter((p) => p.storeId === storeId);
}

export function getStoreName(storeId: string) {
  return stores.find((s) => s.id === storeId)?.name ?? "Helia Market";
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

/** Placeholder merchandising copy for the demo PDP. */
export function getProductDescription(product: Product, storeDisplayName?: string) {
  const store = storeDisplayName ?? getStoreName(product.storeId);
  return `${product.name} is part of the ${product.category} lineup from ${store}. Balanced proportions, premium materials, and a finish tuned for everyday wear. Helia Market is a static UI demo — no real inventory, fulfillment, or checkout.`;
}

/**
 * Similar picks: prefer same category, then same store, stable tie-break by name.
 */
export function getSimilarProductsFromList(
  catalog: Product[],
  productId: string,
  limit = 3,
): Product[] {
  const current = catalog.find((p) => p.id === productId);
  if (!current) return [];

  return catalog
    .filter((p) => p.id !== productId)
    .map((p) => ({
      product: p,
      score:
        (p.category === current.category ? 4 : 0) +
        (p.storeId === current.storeId ? 2 : 0),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.localeCompare(b.product.name);
    })
    .slice(0, limit)
    .map((x) => x.product);
}

export function getSimilarProducts(productId: string, limit = 3): Product[] {
  return getSimilarProductsFromList(products, productId, limit);
}
