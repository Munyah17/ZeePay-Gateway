/**
 * Groq AI client — free-tier hosted open-source models (Llama etc.).
 * Zero-dependency fetch wrapper; every caller must degrade gracefully
 * when GROQ_API_KEY is unset or the API fails — AI is advisory only,
 * never authoritative for money movement.
 *
 * Env: GROQ_API_KEY, optional GROQ_MODEL (default llama-3.3-70b-versatile)
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 10_000;

export function aiEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

/**
 * One-shot chat completion. Returns the message text, or null on
 * missing key / network error / non-200 — callers treat null as
 * "AI unavailable" and fall back to rule-based logic.
 */
export async function chatComplete(
  system: string,
  user: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens ?? 512,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' ? text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Ask the model for a strict JSON object. Returns the parsed object or
 * null. Prompts must describe the exact schema; output is validated by
 * the caller, never trusted blindly.
 */
export async function completeJson<T>(
  system: string,
  user: string,
  options?: { maxTokens?: number }
): Promise<T | null> {
  const text = await chatComplete(
    `${system}\n\nRespond with ONLY a JSON object. No markdown, no prose.`,
    user,
    options
  );
  if (!text) return null;
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
