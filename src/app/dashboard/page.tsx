"use client";

import { Percent, TrendingUp, UserCheck, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-8 xl:max-w-none">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Retention focus"
          value="Strong"
          hint="Experience-led journeys"
          icon={UserCheck}
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
