"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Bot,
  HeartPulse,
  Home,
  LayoutGrid,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type ShellNavOptions = {
  items: ShellNavItem[];
  homeHref: string;
  detailPathPrefix: string;
  showCartCount?: boolean;
};

const ShellNavContext = createContext<ShellNavOptions | undefined>(undefined);

const marketShellNav: ShellNavOptions = {
  items: [
    { href: "/", label: "Home", icon: Home },
    { href: "/stores", label: "Stores", icon: Store },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: "/admin", label: "Admin", icon: Settings },
  ],
  homeHref: "/",
  detailPathPrefix: "/product",
  showCartCount: true,
};

export const aiShellNav: ShellNavOptions = {
  items: [
    { href: "/", label: "Chat", icon: Bot },
    { href: "/tools", label: "Tools", icon: Wrench },
    { href: "/shop", label: "Shop", icon: Sparkles },
    { href: "/cart", label: "Bag", icon: ShoppingBag },
    { href: "/admin", label: "Admin", icon: Settings },
  ],
  homeHref: "/",
  detailPathPrefix: "/shop",
  showCartCount: true,
};

export const healthShellNav: ShellNavOptions = {
  items: [
    { href: "/", label: "Today", icon: HeartPulse },
    { href: "/categories", label: "Move", icon: Activity },
    { href: "/shop", label: "Shop", icon: Package },
    { href: "/cart", label: "Bag", icon: ShoppingBag },
    { href: "/admin", label: "Admin", icon: Settings },
  ],
  homeHref: "/",
  detailPathPrefix: "/workout",
  showCartCount: true,
};

export const learnShellNav: ShellNavOptions = {
  items: [
    { href: "/", label: "Home", icon: Home },
    { href: "/categories", label: "Topics", icon: LayoutGrid },
    { href: "/shop", label: "Courses", icon: BookOpen },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: "/admin", label: "Admin", icon: Settings },
  ],
  homeHref: "/",
  detailPathPrefix: "/course",
  showCartCount: true,
};

export function ShellNavProvider({
  value,
  children,
}: {
  value?: ShellNavOptions;
  children: ReactNode;
}) {
  const resolved = value ?? marketShellNav;
  return (
    <ShellNavContext.Provider value={resolved}>
      {children}
    </ShellNavContext.Provider>
  );
}

export function useShellNav(): ShellNavOptions {
  const ctx = useContext(ShellNavContext);
  return ctx ?? marketShellNav;
}
