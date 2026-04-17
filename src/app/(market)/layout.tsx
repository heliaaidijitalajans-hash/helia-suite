import { AppProviders } from "@/components/providers";
import { MarketShell } from "@/components/MarketShell";

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <MarketShell>{children}</MarketShell>
    </AppProviders>
  );
}
