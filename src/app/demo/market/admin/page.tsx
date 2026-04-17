import { AdminDashboardView } from "@/components/AdminDashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Helia Market demo admin — catalog and simulated analytics.",
};

export default function DemoAdminPage() {
  return <AdminDashboardView />;
}

