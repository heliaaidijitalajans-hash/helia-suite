"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { JsonHighlight } from "./JsonHighlight";
import { prettyJson } from "./types";

type JsonNode =
  | { kind: "scalar"; value: unknown }
  | { kind: "object"; entries: Array<{ key: string; value: unknown }> }
  | { kind: "array"; items: unknown[] };

function toNode(value: unknown): JsonNode {
  if (Array.isArray(value)) return { kind: "array", items: value };
  if (value && typeof value === "object") {
    return {
      kind: "object",
      entries: Object.entries(value as Record<string, unknown>).map(
        ([key, val]) => ({ key, value: val })
      ),
    };
  }
  return { kind: "scalar", value };
}

function CollapsibleNode({
  name,
  value,
  depth,
  defaultOpen,
}: {
  name?: string;
  value: unknown;
  depth: number;
  defaultOpen: boolean;
}) {
  const node = toNode(value);
  const [open, setOpen] = useState(defaultOpen && depth < 2);

  if (node.kind === "scalar") {
    const text = prettyJson(node.value);
    return (
      <div className="font-mono text-xs leading-relaxed">
        {name != null ? (
          <span className="text-sky-300/90">&quot;{name}&quot;</span>
        ) : null}
        {name != null ? <span className="text-white/40">: </span> : null}
        <JsonHighlight text={text} />
      </div>
    );
  }

  const count =
    node.kind === "object" ? node.entries.length : node.items.length;
  const bracketOpen = node.kind === "object" ? "{" : "[";
  const bracketClose = node.kind === "object" ? "}" : "]";

  return (
    <div className="font-mono text-xs leading-relaxed">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left text-white/70 hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {name != null ? (
          <span className="text-sky-300/90">&quot;{name}&quot;</span>
        ) : null}
        {name != null ? <span className="text-white/40">: </span> : null}
        <span className="text-white/40">{bracketOpen}</span>
        {!open ? (
          <span className="text-white/35">
            {" "}
            {count} {node.kind === "object" ? "keys" : "items"} {bracketClose}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="ml-3 border-l border-white/[0.06] pl-3">
          {node.kind === "object"
            ? node.entries.map(({ key: k, value: v }) => (
                <CollapsibleNode
                  key={k}
                  name={k}
                  value={v}
                  depth={depth + 1}
                  defaultOpen={depth < 1}
                />
              ))
            : node.items.map((item, i) => (
                <CollapsibleNode
                  key={i}
                  name={String(i)}
                  value={item}
                  depth={depth + 1}
                  defaultOpen={false}
                />
              ))}
          <div className="text-white/40">{bracketClose}</div>
        </div>
      ) : null}
    </div>
  );
}

export function CollapsibleJson({ value }: { value: unknown }) {
  const parsed = useMemo(() => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return null;
      }
    }
    return value;
  }, [value]);

  if (parsed == null || typeof parsed !== "object") {
    return (
      <pre className="max-h-[480px] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-xs leading-relaxed">
        <JsonHighlight text={prettyJson(value)} />
      </pre>
    );
  }

  return (
    <div className="max-h-[480px] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0f] p-4">
      <CollapsibleNode value={parsed} depth={0} defaultOpen />
    </div>
  );
}
