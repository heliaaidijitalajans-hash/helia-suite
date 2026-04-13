"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function HtmlLang() {
  const pathname = usePathname();

  useEffect(() => {
    const seg = pathname.split("/").filter(Boolean)[0];
    document.documentElement.lang = seg === "tr" ? "tr" : "en";
  }, [pathname]);

  return null;
}
