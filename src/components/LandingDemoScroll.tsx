"use client";

import { MarketHome } from "@/components/MarketHome";
import { MarketShell } from "@/components/MarketShell";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const RESUME_MS = 2800;

/**
 * iPhone demo block with scroll-scrubbed motion (scale, depth, parallax).
 */
export function LandingDemoScroll() {
  const reduce = useReducedMotionHydrationSafe();
  const trackRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useMotionValue(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userPausedRef = useRef(false);
  const [demoVisible, setDemoVisible] = useState(false);

  const stopInnerScroll = useCallback(() => {
    animRef.current?.stop();
    animRef.current = null;
  }, []);

  const syncProgressFromDom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    scrollProgress.set(max > 0 ? el.scrollTop / max : 0);
  }, [scrollProgress]);

  const startInnerScroll = useCallback(() => {
    stopInnerScroll();
    if (reduce || !demoVisible || userPausedRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    if (max < 32) return;

    syncProgressFromDom();
    if (1 - scrollProgress.get() < 0.04) {
      scrollProgress.set(0);
      el.scrollTop = 0;
    }
    const a = scrollProgress.get();
    const b = 1;
    animRef.current = animate(scrollProgress, [a, b], {
      duration: Math.max(2.8, 4.2 * (b - a)),
      ease: [0.33, 0, 0.2, 1],
      repeat: Infinity,
      repeatType: "reverse",
    });
  }, [
    reduce,
    demoVisible,
    scrollProgress,
    stopInnerScroll,
    syncProgressFromDom,
  ]);

  useMotionValueEvent(scrollProgress, "change", (t) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTop = t * max;
  });

  useEffect(() => {
    const root = demoRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([e]) => setDemoVisible(e.isIntersecting),
      { rootMargin: "0px 0px -12% 0px", threshold: [0, 0.12, 0.25] },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!demoVisible || reduce) {
      stopInnerScroll();
      return;
    }
    const el = scrollRef.current;
    if (!el) return;

    const scheduleResume = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null;
        userPausedRef.current = false;
        startInnerScroll();
      }, RESUME_MS);
    };

    const pause = () => {
      userPausedRef.current = true;
      stopInnerScroll();
      scheduleResume();
    };

    const onWheel = () => pause();
    const onPointerDown = () => pause();

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);

    const ro = new ResizeObserver(() => {
      syncProgressFromDom();
      if (!userPausedRef.current) startInnerScroll();
    });
    ro.observe(el);

    userPausedRef.current = false;
    startInnerScroll();

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      ro.disconnect();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      stopInnerScroll();
    };
  }, [
    demoVisible,
    reduce,
    startInnerScroll,
    stopInnerScroll,
    syncProgressFromDom,
  ]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.88", "end 0.18"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 32,
    mass: 0.35,
  });

  const scale = useTransform(
    progress,
    [0, 0.42, 1],
    reduce ? [1, 1, 1] : [0.82, 1, 0.9],
  );
  const y = useTransform(
    progress,
    [0, 0.42, 1],
    reduce ? [0, 0, 0] : [56, 0, -40],
  );
  const rotateX = useTransform(
    progress,
    [0, 0.45, 1],
    reduce ? [0, 0, 0] : [12, 0, -6],
  );
  const shellOpacity = useTransform(
    progress,
    [0, 0.2, 0.55, 0.85, 1],
    reduce ? [1, 1, 1, 1, 1] : [0.72, 0.96, 1, 1, 0.82],
  );
  const ringOpacity = useTransform(
    progress,
    [0, 0.45, 1],
    reduce ? [1, 1, 1] : [0.45, 1, 0.55],
  );
  const captionOpacity = useTransform(
    progress,
    [0, 0.25, 0.7, 1],
    reduce ? [1, 1, 1, 1] : [0.4, 0.85, 1, 0.5],
  );

  return (
    <section
      ref={trackRef}
      className="relative z-10 mx-auto max-w-6xl px-6 pb-28 sm:px-10 sm:pb-36"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Live demo
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          AI-Powered App Systems, in the palm of their hand
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
          Scroll to explore depth and motion — the same premium shell users get inside each demo.
        </p>
      </div>

      <div
        ref={demoRef}
        className="mx-auto flex max-w-[min(100%,440px)] justify-center [perspective:1280px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          style={{
            scale,
            y,
            rotateX,
            opacity: shellOpacity,
            transformPerspective: 1280,
            transformOrigin: "50% 50%",
          }}
          className="will-change-transform"
        >
          <motion.div
            style={{ opacity: ringOpacity }}
            className="relative rounded-[2rem] bg-gradient-to-b from-white/[0.12] to-transparent p-px ring-1 ring-white/10"
          >
            <div className="rounded-[1.85rem] bg-zinc-900/40 p-3 sm:p-5">
              <div className="origin-top scale-[0.92] sm:scale-95">
                <MarketShell contentRef={scrollRef}>
                  <MarketHome />
                </MarketShell>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.p
        style={{ opacity: captionOpacity }}
        className="mt-6 text-center text-[12px] leading-relaxed text-zinc-500"
      >
        Fully interactive demo — same experience your members get on mobile web.
      </motion.p>
    </section>
  );
}
