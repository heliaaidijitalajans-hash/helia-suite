import { AppProviders } from "@/components/providers";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProviders>{children}</AppProviders>;
}
