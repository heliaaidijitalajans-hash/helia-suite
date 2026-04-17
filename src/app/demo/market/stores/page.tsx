import { StoresView } from "@/components/StoresView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stores",
  description: "Browse verified demo partners on Helia Market — AI-Powered App Systems preview.",
};

export default function DemoStoresPage() {
  return <StoresView />;
}

