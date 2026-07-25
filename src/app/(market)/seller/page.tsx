import { AdminDashboardView } from "@/components/AdminDashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Admin",
  description: "Helia Market demo admin — catalog and simulated analytics.",
};

/** Market catalog admin — path `/seller` so it does not collide with Helia `/admin`. */
export default function MarketSellerAdminPage() {
  return <AdminDashboardView />;
}
