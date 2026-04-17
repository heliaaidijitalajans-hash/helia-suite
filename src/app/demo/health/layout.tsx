import { MarketShell } from "@/components/MarketShell";
import { healthShellNav } from "@/lib/shell-nav";

export default function DemoHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketShell basePath="/demo/health" shellNav={healthShellNav}>
      {children}
    </MarketShell>
  );
}

