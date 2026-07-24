"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

type CodeBlockProps = {
  code: string;
  language: string;
  className?: string;
};

function highlightLine(line: string, language: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const push = (text: string, className?: string) => {
    if (!text) return;
    nodes.push(
      <span key={key++} className={className}>
        {text}
      </span>
    );
  };

  if (/^\s*(\/\/|#|--)/.test(remaining) || remaining.trim().startsWith("/*")) {
    push(remaining, "text-white/35");
    return nodes;
  }

  const stringRe =
    language === "php" || language === "dart"
      ? /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/
      : /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/;

  const keywordSets: Record<string, RegExp> = {
    javascript:
      /\b(const|let|var|async|await|function|return|import|from|export|new|if|else|try|catch|throw)\b/,
    typescript:
      /\b(const|let|var|async|await|function|return|import|from|export|new|if|else|try|catch|throw|type|interface|string|number)\b/,
    python:
      /\b(import|from|def|return|async|await|with|as|True|False|None|print|if|else|raise)\b/,
    php: /\b(function|return|echo|new|use|public|private|array|null|true|false)\b/i,
    dart: /\b(import|final|var|await|async|Future|http|print|if|else|return)\b/,
    bash: /\b(curl|export|echo)\b/,
    json: /\b(true|false|null)\b/,
  };

  const keywordRe = keywordSets[language] || keywordSets.javascript;

  while (remaining.length > 0) {
    const strMatch = remaining.match(stringRe);
    const kwMatch = remaining.match(keywordRe!);
    const numMatch = remaining.match(/\b\d+(\.\d+)?\b/);

    type Hit = { index: number; length: number; kind: "str" | "kw" | "num" };
    const hits: Hit[] = [];
    if (strMatch?.index !== undefined) {
      hits.push({
        index: strMatch.index,
        length: strMatch[0].length,
        kind: "str",
      });
    }
    if (kwMatch?.index !== undefined) {
      hits.push({
        index: kwMatch.index,
        length: kwMatch[0].length,
        kind: "kw",
      });
    }
    if (numMatch?.index !== undefined) {
      hits.push({
        index: numMatch.index,
        length: numMatch[0].length,
        kind: "num",
      });
    }

    if (hits.length === 0) {
      push(remaining, "text-white/75");
      break;
    }

    hits.sort((a, b) => a.index - b.index || b.length - a.length);
    const hit = hits[0]!;
    if (hit.index > 0) push(remaining.slice(0, hit.index), "text-white/75");
    const token = remaining.slice(hit.index, hit.index + hit.length);
    push(
      token,
      hit.kind === "str"
        ? "text-emerald-300/90"
        : hit.kind === "kw"
          ? "text-accent"
          : "text-sky-300/90"
    );
    remaining = remaining.slice(hit.index + hit.length);
  }

  return nodes;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f11]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
          {language}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent" strokeWidth={2} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={1.75} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed md:text-[13px]">
        <code>
          {code.split("\n").map((line, i) => (
            <div key={i} className="min-h-[1.25em] whitespace-pre">
              {highlightLine(line, language)}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
