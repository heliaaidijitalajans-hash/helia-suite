/**
 * Production-ready Helia API integration examples for the Administrator.
 */

import { formatAdminSections } from "./response-format";

const ENDPOINT = "https://api.helia.ai/v1/chat";
const USAGE_ENDPOINT = "https://api.helia.ai/v1/usage";

type ExamplePack = {
  id: string;
  labels: string[];
  title: string;
  code: string;
};

const EXAMPLES: ExamplePack[] = [
  {
    id: "curl",
    labels: ["curl", "bash", "shell http"],
    title: "cURL",
    code: `# Helia REST — chat request with auth + error handling
API_KEY="\${HELIA_API_KEY:?HELIA_API_KEY is required}"

curl -sS -X POST "${ENDPOINT}" \\
  -H "Authorization: Bearer \${API_KEY}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"message":"Summarize today's incidents","conversationId":null}' \\
  -w "\\nHTTP_STATUS:%{http_code}\\n"`,
  },
  {
    id: "javascript",
    labels: ["javascript", "js", "browser fetch"],
    title: "JavaScript",
    code: `/**
 * Helia REST — JavaScript fetch (server-side only; never expose live keys in browsers).
 */
async function heliaChat(message) {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) throw new Error("HELIA_API_KEY is missing");

  const res = await fetch("${ENDPOINT}", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, conversationId: null }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data && data.error && data.error.message) || \`Helia API error \${res.status}\`
    );
  }
  return data;
}`,
  },
  {
    id: "typescript",
    labels: ["typescript", "ts"],
    title: "TypeScript",
    code: `/** Helia REST — TypeScript with typed error handling */
type HeliaChatResponse = {
  id: string;
  conversationId: string;
  role: "assistant";
  content: string;
  createdAt: string;
};

export async function heliaChat(message: string): Promise<HeliaChatResponse> {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) throw new Error("HELIA_API_KEY is missing");

  const res = await fetch("${ENDPOINT}", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, conversationId: null }),
  });

  const data = (await res.json().catch(() => null)) as
    | HeliaChatResponse
    | { error?: { message?: string } }
    | null;

  if (!res.ok) {
    throw new Error(
      (data && "error" in data && data.error?.message) ||
        \`Helia API error \${res.status}\`
    );
  }
  return data as HeliaChatResponse;
}`,
  },
  {
    id: "node",
    labels: ["node", "nodejs", "node.js"],
    title: "Node.js",
    code: `import { request } from "node:https";

/**
 * Helia REST — Node.js https request with status checks.
 */
export function heliaChat(message) {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) return Promise.reject(new Error("HELIA_API_KEY is missing"));

  const body = JSON.stringify({ message, conversationId: null });

  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: "api.helia.ai",
        path: "/v1/chat",
        method: "POST",
        headers: {
          Authorization: \`Bearer \${apiKey}\`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode || 500) >= 400) {
            reject(new Error(\`Helia API error \${res.statusCode}: \${text}\`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}`,
  },
  {
    id: "python",
    labels: ["python", "requests"],
    title: "Python",
    code: `import os
import requests

def helia_chat(message: str) -> dict:
    """Helia REST — Python requests with auth and raise_for_status."""
    api_key = os.environ.get("HELIA_API_KEY")
    if not api_key:
        raise RuntimeError("HELIA_API_KEY is missing")

    res = requests.post(
        "${ENDPOINT}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={"message": message, "conversationId": None},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()`,
  },
  {
    id: "php",
    labels: ["php"],
    title: "PHP",
    code: `<?php
/**
 * Helia REST — PHP cURL with auth + HTTP error handling.
 */
function helia_chat(string $message): array {
  $apiKey = getenv('HELIA_API_KEY');
  if (!$apiKey) {
    throw new RuntimeException('HELIA_API_KEY is missing');
  }

  $payload = json_encode([
    'message' => $message,
    'conversationId' => null,
  ]);

  $ch = curl_init('${ENDPOINT}');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $apiKey,
      'Content-Type: application/json',
      'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
  ]);

  $response = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  if ($response === false) {
    throw new RuntimeException(curl_error($ch));
  }
  curl_close($ch);

  if ($status >= 400) {
    throw new RuntimeException("Helia API error {$status}: {$response}");
  }
  return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
}`,
  },
  {
    id: "csharp",
    labels: ["c#", "csharp", "dotnet", ".net"],
    title: "C#",
    code: `using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

/// <summary>Helia REST — C# HttpClient with auth and error handling.</summary>
public static async Task<JsonDocument> HeliaChatAsync(string message)
{
    var apiKey = Environment.GetEnvironmentVariable("HELIA_API_KEY")
        ?? throw new InvalidOperationException("HELIA_API_KEY is missing");

    using var client = new HttpClient();
    using var req = new HttpRequestMessage(HttpMethod.Post, "${ENDPOINT}");
    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
    req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    req.Content = new StringContent(
        JsonSerializer.Serialize(new { message, conversationId = (string?)null }),
        Encoding.UTF8,
        "application/json");

    using var res = await client.SendAsync(req);
    var body = await res.Content.ReadAsStringAsync();
    if (!res.IsSuccessStatusCode)
        throw new HttpRequestException($"Helia API error {(int)res.StatusCode}: {body}");
    return JsonDocument.Parse(body);
}`,
  },
  {
    id: "go",
    labels: ["go", "golang"],
    title: "Go",
    code: `package helia

import (
  "bytes"
  "encoding/json"
  "fmt"
  "io"
  "net/http"
  "os"
  "time"
)

// Chat sends a Helia REST chat request with auth and error handling.
func Chat(message string) (map[string]any, error) {
  apiKey := os.Getenv("HELIA_API_KEY")
  if apiKey == "" {
    return nil, fmt.Errorf("HELIA_API_KEY is missing")
  }
  payload, _ := json.Marshal(map[string]any{
    "message": message, "conversationId": nil,
  })
  req, err := http.NewRequest(http.MethodPost, "${ENDPOINT}", bytes.NewReader(payload))
  if err != nil {
    return nil, err
  }
  req.Header.Set("Authorization", "Bearer "+apiKey)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("Accept", "application/json")

  client := &http.Client{Timeout: 30 * time.Second}
  res, err := client.Do(req)
  if err != nil {
    return nil, err
  }
  defer res.Body.Close()
  body, _ := io.ReadAll(res.Body)
  if res.StatusCode >= 400 {
    return nil, fmt.Errorf("Helia API error %d: %s", res.StatusCode, string(body))
  }
  var out map[string]any
  if err := json.Unmarshal(body, &out); err != nil {
    return nil, err
  }
  return out, nil
}`,
  },
  {
    id: "java",
    labels: ["java"],
    title: "Java",
    code: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Helia REST — Java HttpClient with auth and error handling. */
public final class HeliaClient {
  public static String chat(String message) throws Exception {
    String apiKey = System.getenv("HELIA_API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("HELIA_API_KEY is missing");
    }
    String json = "{\\"message\\":\\"" + message.replace("\\"", "\\\\\\"") + "\\",\\"conversationId\\":null}";
    HttpRequest req = HttpRequest.newBuilder()
      .uri(URI.create("${ENDPOINT}"))
      .timeout(Duration.ofSeconds(30))
      .header("Authorization", "Bearer " + apiKey)
      .header("Content-Type", "application/json")
      .header("Accept", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(json))
      .build();
    HttpResponse<String> res = HttpClient.newHttpClient()
      .send(req, HttpResponse.BodyHandlers.ofString());
    if (res.statusCode() >= 400) {
      throw new IllegalStateException("Helia API error " + res.statusCode() + ": " + res.body());
    }
    return res.body();
  }
}`,
  },
  {
    id: "nextjs",
    labels: ["next", "next.js", "nextjs"],
    title: "Next.js",
    code: `// app/api/helia/chat/route.ts — server route only
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: { message: "HELIA_API_KEY is missing" } },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { ok: false, error: { message: "message is required" } },
      { status: 400 }
    );
  }

  const res = await fetch("${ENDPOINT}", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, conversationId: null }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: { message: data?.error?.message || \`Upstream \${res.status}\` } },
      { status: res.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}`,
  },
  {
    id: "react",
    labels: ["react"],
    title: "React",
    code: `/**
 * React UI calls YOUR backend — never the Helia live key from the browser.
 */
export async function askHeliaFromUi(message: string) {
  const res = await fetch("/api/helia/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || \`Request failed (\${res.status})\`);
  }
  return data;
}`,
  },
  {
    id: "vue",
    labels: ["vue"],
    title: "Vue",
    code: `// Call a server proxy; keep HELIA_API_KEY off the client.
export async function askHelia(message) {
  const res = await fetch("/api/helia/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || \`Helia error \${res.status}\`);
  return data;
}`,
  },
  {
    id: "angular",
    labels: ["angular"],
    title: "Angular",
    code: `import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

/** Angular service → your backend proxy (API key stays server-side). */
@Injectable({ providedIn: "root" })
export class HeliaService {
  constructor(private http: HttpClient) {}
  ask(message: string) {
    return firstValueFrom(
      this.http.post("/api/helia/chat", { message })
    );
  }
}`,
  },
  {
    id: "webhook",
    labels: ["webhook", "webhooks"],
    title: "Webhook receiver",
    code: `import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/** Verify Helia webhook signature before processing. */
export async function POST(request: Request) {
  const secret = process.env.HELIA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "HELIA_WEBHOOK_SECRET missing" }, { status: 500 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-helia-signature") || "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  // TODO: idempotent handling by event.id
  return NextResponse.json({ ok: true, received: event.id ?? true });
}`,
  },
  {
    id: "zapier",
    labels: ["zapier"],
    title: "Zapier",
    code: `Zapier Webhooks by Zapier → Custom Request
Method: POST
URL: ${ENDPOINT}
Headers:
  Authorization: Bearer {{HELIA_API_KEY}}
  Content-Type: application/json
  Accept: application/json
Body (JSON):
  { "message": "{{message}}", "conversationId": null }

Store HELIA_API_KEY in Zapier Secrets. Map non-2xx to Halt & error notification.`,
  },
  {
    id: "n8n",
    labels: ["n8n"],
    title: "n8n",
    code: `n8n HTTP Request node
Method: POST
URL: ${ENDPOINT}
Authentication: Header Auth
  Name: Authorization
  Value: Bearer {{$credentials.heliaApiKey}}
Headers: Accept = application/json
Body (JSON): { "message": "{{$json.message}}", "conversationId": null }
Options: Timeout 30000; continue on fail = false`,
  },
  {
    id: "make",
    labels: ["make", "integromat"],
    title: "Make",
    code: `Make.com HTTP module
URL: ${ENDPOINT}
Method: POST
Headers:
  Authorization: Bearer {{HELIA_API_KEY}}
  Content-Type: application/json
Request content: {"message":"{{message}}","conversationId":null}
Parse response as JSON; on status >= 400 route to error handler.`,
  },
  {
    id: "usage",
    labels: ["usage example", "get usage"],
    title: "Usage (GET)",
    code: `curl -sS "${USAGE_ENDPOINT}" \\
  -H "Authorization: Bearer \${HELIA_API_KEY}" \\
  -H "Accept: application/json"`,
  },
];

export function generateCodeExample(questionRaw: string): string | null {
  const q = questionRaw.trim().toLowerCase();
  if (
    !/\b(example|sample|snippet|code|sdk|generate|show me|integration)\b/i.test(
      q
    ) &&
    !EXAMPLES.some((e) => e.labels.some((l) => q.includes(l)))
  ) {
    return null;
  }

  const match =
    EXAMPLES.find((e) => e.labels.some((l) => q.includes(l))) ||
    (/\brest\b/i.test(q) ? EXAMPLES.find((e) => e.id === "curl") : undefined);

  if (!match) {
    // Generic request for "code example" without language → TypeScript
    if (/\b(code|example|sdk|integration)\b/i.test(q)) {
      const ts = EXAMPLES.find((e) => e.id === "typescript")!;
      return formatAdminSections({
        status: "Code generation",
        summary: `Production-ready ${ts.title} example for Helia REST (${ENDPOINT}).`,
        extraSections: [{ title: ts.title, body: "```\n" + ts.code + "\n```" }],
        recommendation:
          "Keep HELIA_API_KEY in server environment variables. Never ship live keys to browsers.",
        nextStep: "Specify a language (Python, Go, cURL, webhook, Zapier, …) for a tailored snippet.",
      });
    }
    return null;
  }

  return formatAdminSections({
    status: "Code generation",
    summary: `Production-ready ${match.title} example for Helia REST.`,
    extraSections: [{ title: match.title, body: "```\n" + match.code + "\n```" }],
    recommendation:
      "Authenticate with Authorization: Bearer <api_key>. Handle non-2xx responses and never log secrets.",
    nextStep: "Test with a hl_test_ key first, then promote to hl_live_ in production.",
  });
}
