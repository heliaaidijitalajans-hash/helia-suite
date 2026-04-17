import { HealthHome } from "@/components/health/HealthHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Helia Health — discover workouts and plans (demo).",
};

export default function DemoHealthShopPage() {
  return <HealthHome />;
}

