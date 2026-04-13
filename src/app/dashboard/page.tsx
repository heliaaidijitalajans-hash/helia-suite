"use client";

import { DollarSign, Percent, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value="$284,900"
          hint="+12.4% this month"
          icon={DollarSign}
          delay={0}
        />
        <KpiCard
          label="Active users"
          value="12,480"
          hint="Concurrent seats"
          icon={Users}
          delay={0.06}
        />
        <KpiCard
          label="Leads"
          value="1,842"
          hint="Qualified pipeline"
          icon={TrendingUp}
          delay={0.12}
        />
        <KpiCard
          label="Growth"
          value="18.2%"
          hint="QoQ velocity"
          icon={Percent}
          delay={0.18}
        />
      </div>
    </div>
  );
}
