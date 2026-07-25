import {
  sanitizeHeadersForCodeExport,
} from "@/lib/admin/api-tester-auth";
import type { HttpMethod } from "./types";

export type CodegenInput = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  apiKey?: string;
};

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Never embed real secrets in generated snippets. */
function safeInput(input: CodegenInput): CodegenInput {
  return {
    ...input,
    headers: sanitizeHeadersForCodeExport(input.headers, input.apiKey),
    apiKey: undefined,
  };
}

function headerLines(
  headers: Record<string, string>,
  style: "curl" | "js" | "py" | "go" | "php" | "cs"
): string {
  const entries = Object.entries(headers);
  if (style === "curl") {
    return entries
      .map(([k, v]) => `  -H "${esc(k)}: ${esc(v)}"`)
      .join(" \\\n");
  }
  if (style === "js") {
    return entries.map(([k, v]) => `    "${esc(k)}": "${esc(v)}"`).join(",\n");
  }
  if (style === "py") {
    return entries.map(([k, v]) => `    "${esc(k)}": "${esc(v)}"`).join(",\n");
  }
  if (style === "go") {
    return entries
      .map(([k, v]) => `\treq.Header.Set("${esc(k)}", "${esc(v)}")`)
      .join("\n");
  }
  if (style === "php") {
    return entries.map(([k, v]) => `  "${esc(k)}: ${esc(v)}"`).join(",\n");
  }
  return entries
    .map(
      ([k, v]) =>
        `    request.Headers.TryAddWithoutValidation("${esc(k)}", "${esc(v)}");`
    )
    .join("\n");
}

export function generateCurl(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  const parts = [
    `curl -sS -X ${input.method} "${input.url}" \\`,
    headerLines(input.headers, "curl") || '  -H "Accept: application/json"',
  ];
  if (hasBody) {
    parts.push(`  -d '${JSON.stringify(input.body)}'`);
  }
  return parts.filter(Boolean).join("\n");
}

export function generateFetch(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `const res = await fetch("${input.url}", {
  method: "${input.method}",
  headers: {
${headerLines(input.headers, "js")}
  },${
    hasBody
      ? `\n  body: JSON.stringify(${JSON.stringify(input.body, null, 2)}),`
      : ""
  }
});

if (!res.ok) {
  throw new Error(\`HTTP \${res.status}\`);
}
const data = await res.json();
console.log(data);`;
}

export function generateAxios(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `import axios from "axios";

const res = await axios({
  method: "${input.method.toLowerCase()}",
  url: "${input.url}",
  headers: {
${headerLines(input.headers, "js")}
  },${hasBody ? `\n  data: ${JSON.stringify(input.body, null, 2)},` : ""}
});

console.log(res.status, res.data);`;
}

export function generatePython(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `import requests

res = requests.request(
    "${input.method}",
    "${input.url}",
    headers={
${headerLines(input.headers, "py")}
    },${
      hasBody
        ? `\n    json=${JSON.stringify(input.body, null, 4).split("\n").join("\n    ")},`
        : ""
    }
    timeout=30,
)
res.raise_for_status()
print(res.status_code, res.json())`;
}

export function generateGo(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `package main

import (
  "bytes"
  "fmt"
  "io"
  "net/http"
)

func main() {
  var body io.Reader
${
  hasBody
    ? `  payload := []byte(\`${JSON.stringify(input.body)}\`)
  body = bytes.NewReader(payload)`
    : `  body = nil`
}
  req, err := http.NewRequest("${input.method}", "${input.url}", body)
  if err != nil { panic(err) }
${headerLines(input.headers, "go")}
  res, err := http.DefaultClient.Do(req)
  if err != nil { panic(err) }
  defer res.Body.Close()
  b, _ := io.ReadAll(res.Body)
  fmt.Println(res.StatusCode, string(b))
}`;
}

export function generatePhp(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `<?php
$ch = curl_init("${input.url}");
curl_setopt_array($ch, [
  CURLOPT_CUSTOMREQUEST => "${input.method}",
  CURLOPT_HTTPHEADER => [
${headerLines(input.headers, "php")}
  ],
  CURLOPT_RETURNTRANSFER => true,${
    hasBody
      ? `\n  CURLOPT_POSTFIELDS => json_encode(${JSON.stringify(input.body)}),`
      : ""
  }
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $status, PHP_EOL, $response;`;
}

export function generateCSharp(input: CodegenInput): string {
  const hasBody =
    input.body !== undefined &&
    input.method !== "GET" &&
    input.method !== "DELETE";
  return `using var client = new HttpClient();
using var request = new HttpRequestMessage(HttpMethod.${methodToCs(
    input.method
  )}, "${input.url}");
${headerLines(input.headers, "cs")}
${
  hasBody
    ? `request.Content = new StringContent(
    """${JSON.stringify(input.body)}""",
    System.Text.Encoding.UTF8,
    "application/json");`
    : ""
}
using var response = await client.SendAsync(request);
var text = await response.Content.ReadAsStringAsync();
Console.WriteLine((int)response.StatusCode);
Console.WriteLine(text);`;
}

function methodToCs(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "Get";
    case "POST":
      return "Post";
    case "PUT":
      return "Put";
    case "PATCH":
      return "Patch";
    case "DELETE":
      return "Delete";
  }
}

export type CodeLang =
  | "curl"
  | "fetch"
  | "axios"
  | "python"
  | "go"
  | "php"
  | "csharp";

export function generateCode(lang: CodeLang, input: CodegenInput): string {
  const sanitized = safeInput(input);
  switch (lang) {
    case "curl":
      return generateCurl(sanitized);
    case "fetch":
      return generateFetch(sanitized);
    case "axios":
      return generateAxios(sanitized);
    case "python":
      return generatePython(sanitized);
    case "go":
      return generateGo(sanitized);
    case "php":
      return generatePhp(sanitized);
    case "csharp":
      return generateCSharp(sanitized);
  }
}
