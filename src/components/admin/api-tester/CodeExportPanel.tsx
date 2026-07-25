"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { adminBtnSecondary, adminInputClass } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import {
  generateCode,
  type CodeLang,
  type CodegenInput,
} from "./codegen";

const LANGS: { id: CodeLang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "fetch", label: "JavaScript Fetch" },
  { id: "axios", label: "Axios" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "php", label: "PHP" },
  { id: "csharp", label: "C#" },
];

export function CodeExportPanel({ input }: { input: CodegenInput | null }) {
  const [lang, setLang] = useState<CodeLang>("curl");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    if (!input) return "// Configure a request to generate code.";
    return generateCode(lang, input);
  }, [input, lang]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={cn(adminInputClass, "max-w-xs")}
          value={lang}
          onChange={(e) => setLang(e.target.value as CodeLang)}
        >
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <button type="button" className={adminBtnSecondary} onClick={() => void copy()}>
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="max-h-[320px] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-[11px] leading-relaxed text-white/75">
        {code}
      </pre>
    </div>
  );
}
