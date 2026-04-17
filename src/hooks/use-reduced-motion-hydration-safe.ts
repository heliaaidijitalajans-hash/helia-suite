"use client";

import { useEffect, useState } from "react";

/**
 * Returns prefers-reduced-motion after mount to avoid SSR/client mismatch.
 */
export function useReducedMotionHydrationSafe(): boolean | undefined {
  const [reduce, setReduce] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduce;
}
