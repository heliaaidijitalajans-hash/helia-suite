"use client";

import type { ReactNode } from "react";

/** Lightweight JSON syntax highlight for dark admin UI (no external deps). */
export function JsonHighlight({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <span className="text-white/35">Run a request to see JSON here.</span>
    );
  }

  const parts: ReactNode[] = [];
  const re =
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={key++} className="text-white/55">
          {text.slice(last, m.index)}
        </span>
      );
    }
    if (m[1]) {
      parts.push(
        <span key={key++} className="text-sky-300/90">
          {m[1]}
        </span>
      );
      parts.push(
        <span key={key++} className="text-white/45">
          :
        </span>
      );
    } else if (m[2]) {
      parts.push(
        <span key={key++} className="text-emerald-300/90">
          {m[2]}
        </span>
      );
    } else if (m[3]) {
      parts.push(
        <span key={key++} className="text-violet-300/90">
          {m[3]}
        </span>
      );
    } else if (m[4]) {
      parts.push(
        <span key={key++} className="text-amber-300/90">
          {m[4]}
        </span>
      );
    } else if (m[5]) {
      parts.push(
        <span key={key++} className="text-white/40">
          {m[5]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    parts.push(
      <span key={key++} className="text-white/55">
        {text.slice(last)}
      </span>
    );
  }

  return <>{parts}</>;
}
