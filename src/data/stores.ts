export type Store = {
  id: string;
  name: string;
  tagline: string;
  /** Square-friendly brand image (Unsplash). */
  logo: string;
  rating: number;
  reviewCount: number;
};

/**
 * Demo vendors — static, no API.
 */
export const stores: Store[] = [
  {
    id: "fashion",
    name: "Fashion Store",
    tagline: "Quiet luxury & everyday elegance",
    logo:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    reviewCount: 12840,
  },
  {
    id: "tech",
    name: "Tech Store",
    tagline: "Design-forward gadgets & gear",
    logo:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    reviewCount: 22105,
  },
  {
    id: "streetwear",
    name: "Streetwear Store",
    tagline: "Limited drops & premium basics",
    logo:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    reviewCount: 9420,
  },
];

export const SEED_STORE_IDS = new Set(stores.map((s) => s.id));

export function getStoreById(id: string) {
  return stores.find((s) => s.id === id);
}
