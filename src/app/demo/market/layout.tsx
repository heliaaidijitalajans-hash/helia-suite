import { MarketShell } from "@/components/MarketShell";

export default function DemoMarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketShell basePath="/demo/market">{children}</MarketShell>;
}

