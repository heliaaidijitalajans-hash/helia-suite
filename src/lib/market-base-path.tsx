"use client";

import { createContext, useContext, type ReactNode } from "react";

const MarketBasePathContext = createContext<string | undefined>(undefined);

export function MarketBasePathProvider({
  basePath,
  children,
}: {
  basePath?: string;
  children: ReactNode;
}) {
  const normalized =
    basePath && basePath !== "/" ? basePath.replace(/\/$/, "") : undefined;
  return (
    <MarketBasePathContext.Provider value={normalized}>
      {children}
    </MarketBasePathContext.Provider>
  );
}

export function useMarketBasePath(): string | undefined {
  return useContext(MarketBasePathContext);
}

export function withMarketBasePath(
  basePath: string | undefined,
  path: string
): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) return p;
  return `${basePath}${p === "/" ? "" : p}`;
}
