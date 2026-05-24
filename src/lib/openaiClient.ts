/**
 * Browser-side OpenAI helper. Reads the key from `VITE_OPENAI_API_KEY`.
 *
 * SECURITY: the key is bundled into the client JS, so DO NOT deploy this
 * code as-is to a public site. For production, proxy all OpenAI calls
 * through a server you control.
 */

import OpenAI from "openai";

const KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

let _client: OpenAI | null = null;

export function hasOpenAIKey(): boolean {
  return Boolean(KEY && KEY.length > 20 && !KEY.includes("replace-me"));
}

export function getClient(): OpenAI | null {
  if (!hasOpenAIKey()) return null;
  if (_client) return _client;
  _client = new OpenAI({
    apiKey: KEY,
    // Required to allow the browser-side call. See file header for the
    // security implications.
    dangerouslyAllowBrowser: true
  });
  return _client;
}

export const OPENAI_MODEL = MODEL;

/**
 * One-shot chat completion. Returns the text content of the assistant message,
 * or null if the request fails or no key is configured.
 */
export async function chat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; max_tokens?: number } = {}
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.max_tokens ?? 600
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return null;
  }
}

/**
 * Streaming chat completion. Calls `onToken` for each token chunk.
 * Resolves with the full text when complete, or null on failure / no key.
 */
export async function streamChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  onToken: (chunk: string) => void,
  opts: { temperature?: number; max_tokens?: number; signal?: AbortSignal } = {}
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const stream = await client.chat.completions.create(
      {
        model: MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.max_tokens ?? 600,
        stream: true
      },
      { signal: opts.signal }
    );
    let full = "";
    for await (const part of stream) {
      const tok = part.choices?.[0]?.delta?.content ?? "";
      if (tok) {
        full += tok;
        onToken(tok);
      }
    }
    return full.trim();
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return null;
    console.error("OpenAI stream error:", err);
    return null;
  }
}

/**
 * Helper for "structured" extraction. Wraps the prompt with a JSON-output
 * instruction. Returns parsed JSON or null.
 */
export async function chatJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number } = {}
): Promise<T | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt + "\n\nRespond with valid JSON only. No markdown fences." },
        { role: "user", content: userPrompt }
      ],
      temperature: opts.temperature ?? 0.2,
      response_format: { type: "json_object" }
    });
    const txt = res.choices[0]?.message?.content?.trim();
    if (!txt) return null;
    return JSON.parse(txt) as T;
  } catch (err) {
    console.error("OpenAI JSON error:", err);
    return null;
  }
}
