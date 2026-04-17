"use client";

import { BottomNav } from "@/components/BottomNav";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MarketBasePathProvider } from "@/lib/market-base-path";
import { ShellNavProvider, type ShellNavOptions } from "@/lib/shell-nav";
import type { ReactNode, Ref } from "react";

type MarketShellProps = {
  children: ReactNode;
  /** When set, points at the scrollable main content area (e.g. for landing demo auto-scroll). */
  contentRef?: Ref<HTMLDivElement>;
  /** Prefix all in-market routes, e.g. `/demo/market`. */
  basePath?: string;
  /** Optional bottom tab labels, icons, and detail-route prefix (learn vs market). */
  shellNav?: ShellNavOptions;
};

/**
 * Phone chrome + scrollable route content + bottom tab bar (in-app feel).
 */
export function MarketShell({ children, contentRef, basePath, shellNav }: MarketShellProps) {
  return (
    <MarketBasePathProvider basePath={basePath}>
      <ShellNavProvider value={shellNav}>
        <PhoneFrame>
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={contentRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
            >
              {children}
            </div>
            <BottomNav />
          </div>
        </PhoneFrame>
      </ShellNavProvider>
    </MarketBasePathProvider>
  );
}
