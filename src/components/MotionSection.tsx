"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeSlide } from "@/lib/motion";
import { cn } from "@/lib/cn";

type MotionSectionProps = HTMLMotionProps<"section"> & {
  className?: string;
};

export function MotionSection({
  className,
  children,
  ...props
}: MotionSectionProps) {
  return (
    <motion.section
      className={cn(className)}
      initial={fadeSlide.initial}
      whileInView={fadeSlide.whileInView}
      viewport={fadeSlide.viewport}
      transition={fadeSlide.transition}
      {...props}
    >
      {children}
    </motion.section>
  );
}
