"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/config/site";
import { cn } from "@/lib/cn";

export function FloatingWhatsApp({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        "fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_-4px_rgba(37,211,102,0.55)] transition-[transform,box-shadow] duration-300 ease-out hover:scale-110 hover:shadow-[0_12px_40px_-4px_rgba(37,211,102,0.65)] active:scale-95 md:h-[3.75rem] md:w-[3.75rem]",
        "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[calc(1.25rem+env(safe-area-inset-right,0px))] md:bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))] md:right-[calc(1.75rem+env(safe-area-inset-right,0px))]",
        className
      )}
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
