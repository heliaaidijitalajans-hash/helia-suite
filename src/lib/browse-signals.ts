export const LAST_VIEWED_KEY = "helia:last-viewed-product-id";

export function saveLastViewedProductId(productId: string) {
  try {
    window.localStorage.setItem(LAST_VIEWED_KEY, productId);
  } catch {
    /* ignore quota / private mode */
  }
}
