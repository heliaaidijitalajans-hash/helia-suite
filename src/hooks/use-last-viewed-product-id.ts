"use client";

import { LAST_VIEWED_KEY } from "@/lib/browse-signals";
import { useEffect, useState } from "react";

export function useLastViewedProductId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(LAST_VIEWED_KEY);
      setId(v && v.length > 0 ? v : null);
    } catch {
      setId(null);
    }
  }, []);

  return id;
}
