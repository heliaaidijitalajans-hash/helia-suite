"use client";

import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Activity, MousePointerClick, Timer } from "lucide-react";

export default function DashboardAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard
          label="Session depth"
          value="6.4 pg"
          hint="Avg. per visit"
          icon={MousePointerClick}
          delay={0}
        />
        <KpiCard
          label="Conversion"
          value="3.28%"
          hint="Funnel exit A"
          icon={Activity}
          delay={0.06}
        />
        <KpiCard
          label="Latency p95"
          value="118 ms"
          hint="Edge region"
          icon={Timer}
          delay={0.12}
        />
      </div>
      <AnalyticsChart />
    </div>
  );
}
