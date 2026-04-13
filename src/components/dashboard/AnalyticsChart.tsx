"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const SERIES = [
  12, 18, 15, 28, 24, 36, 32, 44, 40, 52, 48, 64, 58, 72, 68, 78, 74, 86, 82,
  92,
];

export function AnalyticsChart() {
  const { pathLine, pathArea, viewBox } = useMemo(() => {
    const w = 800;
    const h = 220;
    const pad = 16;
    const max = Math.max(...SERIES);
    const min = 0;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const points = SERIES.map((v, i) => {
      const x = pad + (i / (SERIES.length - 1)) * innerW;
      const y = pad + innerH - ((v - min) / (max - min)) * innerH;
      return { x, y };
    });
    const lineD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
    const areaD = `${lineD} L ${points[points.length - 1].x} ${h - pad} L ${pad} ${h - pad} Z`;
    return { pathLine: lineD, pathArea: areaD, viewBox: `0 0 ${w} ${h}` };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Growth momentum</h2>
          <p className="mt-1 text-xs text-white/45">
            Last 20 periods · illustrative trend
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight text-white">
            +24.8%
          </p>
          <p className="text-xs font-medium text-accent">vs prior window</p>
        </div>
      </div>
      <div className="relative aspect-[16/6] min-h-[200px] w-full">
        <svg
          className="h-full w-full"
          viewBox={viewBox}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id="chartFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1="16"
              y1={16 + (220 - 32) * t}
              x2="784"
              y2={16 + (220 - 32) * t}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}
          <motion.path
            d={pathArea}
            fill="url(#chartFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.path
            d={pathLine}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 1.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.4 } }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161618] to-transparent" />
      </div>
    </motion.div>
  );
}
