import { MarketShell } from "@/components/MarketShell";
import { aiShellNav } from "@/lib/shell-nav";

export default function DemoAiLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketShell basePath="/demo/ai" shellNav={aiShellNav}>
      {children}
    </MarketShell>
  );
}
