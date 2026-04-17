import { MarketShell } from "@/components/MarketShell";

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketShell>{children}</MarketShell>;
}
