import { MarketShell } from "@/components/MarketShell";
import { learnShellNav } from "@/lib/shell-nav";

export default function DemoLearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketShell basePath="/demo/learn" shellNav={learnShellNav}>
      {children}
    </MarketShell>
  );
}
