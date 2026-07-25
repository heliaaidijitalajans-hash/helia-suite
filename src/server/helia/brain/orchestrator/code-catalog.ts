/**
 * Code catalog for CodeGenerationService tool (structured JSON payload).
 */

export const EXAMPLES = [
  {
    id: "typescript",
    labels: ["typescript", "ts"],
    title: "TypeScript",
    code: `/** Helia REST — TypeScript */
type HeliaChatResponse = { id: string; content: string };

export async function heliaChat(message: string): Promise<HeliaChatResponse> {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) throw new Error("HELIA_API_KEY is missing");

  const res = await fetch("https://api.helia.ai/v1/chat", {
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
  return data as HeliaChatResponse;
}`,
  },
  {
    id: "python",
    labels: ["python"],
    title: "Python",
    code: `import os, requests

def helia_chat(message: str) -> dict:
    api_key = os.environ.get("HELIA_API_KEY")
    if not api_key:
        raise RuntimeError("HELIA_API_KEY is missing")
    res = requests.post(
        "https://api.helia.ai/v1/chat",
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
    id: "curl",
    labels: ["curl", "bash"],
    title: "cURL",
    code: `curl -sS -X POST "https://api.helia.ai/v1/chat" \\
  -H "Authorization: Bearer \${HELIA_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"message":"Summarize today","conversationId":null}'`,
  },
  {
    id: "node",
    labels: ["node", "nodejs", "node.js"],
    title: "Node.js",
    code: `export async function heliaChat(message) {
  const apiKey = process.env.HELIA_API_KEY;
  if (!apiKey) throw new Error("HELIA_API_KEY is missing");
  const res = await fetch("https://api.helia.ai/v1/chat", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, conversationId: null }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || \`Helia API error \${res.status}\`);
  return data;
}`,
  },
  {
    id: "webhook",
    labels: ["webhook", "webhooks"],
    title: "Webhook",
    code: `// Verify signature before processing Helia webhook events.
// Headers: x-helia-signature — HMAC-SHA256 of raw body with HELIA_WEBHOOK_SECRET.`,
  },
  {
    id: "zapier",
    labels: ["zapier"],
    title: "Zapier",
    code: `Zapier Custom Request POST https://api.helia.ai/v1/chat
Authorization: Bearer {{HELIA_API_KEY}}
Content-Type: application/json
Body: {"message":"{{message}}","conversationId":null}`,
  },
  {
    id: "n8n",
    labels: ["n8n"],
    title: "n8n",
    code: `n8n HTTP Request → POST https://api.helia.ai/v1/chat
Header Authorization: Bearer {{$credentials.heliaApiKey}}
JSON body: { "message": "{{$json.message}}", "conversationId": null }`,
  },
  {
    id: "make",
    labels: ["make"],
    title: "Make",
    code: `Make HTTP module POST https://api.helia.ai/v1/chat
Authorization: Bearer {{HELIA_API_KEY}}
Body: {"message":"{{message}}","conversationId":null}`,
  },
] as const;
