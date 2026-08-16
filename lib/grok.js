// Two paths, and each one picks its own provider. Both default to xAI, which
// is the local and demo configuration. Pointing ONLY the read path at a free
// OpenRouter model is how a publicly-hosted deployment stops burning xAI credit
// on every visitor message without changing anything about what Grok 4.6 does
// on the write path. OpenRouter is OpenAI-compatible, so a provider is nothing
// more than a base URL and a key.
//
// Read every value lazily: .env is parsed after the import graph resolves.
const PROVIDERS = {
  xai: { label: 'xAI', base: 'https://api.x.ai/v1', keyVar: 'XAI_API_KEY' },
  openrouter: {
    label: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    keyVar: 'OPENROUTER_API_KEY',
  },
};

const PROVIDER_VAR = { reason: 'REASON_PROVIDER', fast: 'FAST_PROVIDER' };

/** Which provider serves a given path. `path` is 'reason' or 'fast'. */
export function provider(path) {
  const name = (process.env[PROVIDER_VAR[path]] || 'xai').toLowerCase();
  const p = PROVIDERS[name];
  if (!p) {
    throw new Error(
      `Unknown ${PROVIDER_VAR[path]}="${name}". Use one of: ${Object.keys(PROVIDERS).join(', ')}`,
    );
  }
  return { name, ...p };
}

// VERIFIED 2026-08-15 against GET https://api.x.ai/v1/models. The ids are
// dotted, not hyphenated: "grok-4-6" 404s with "model does not exist". There is
// no "grok-4-fast-*" on this account either; the non-reasoning model is the
// grok-4.20 variant. Check /v1/models before changing these.
//
// GROK_*_MODEL are the original names and still work. REASON_MODEL/FAST_MODEL
// are the provider-neutral spelling to use when a path is not on xAI at all.
export const MODELS = {
  // Write path. Reasoning cannot be disabled on grok-4.6. That is fine here
  // because nothing human-facing is blocked on it.
  get reason() {
    return process.env.REASON_MODEL || process.env.GROK_REASON_MODEL || 'grok-4.6';
  },
  // Read path. Sub-second (measured 450ms). A player will not wait for a guard.
  get fast() {
    return process.env.FAST_MODEL || process.env.GROK_FAST_MODEL || 'grok-4.20-0309-non-reasoning';
  },
};

/** Is the given path callable at all? Defaults to the write path. */
export function hasKey(path = 'reason') {
  return Boolean(process.env[provider(path).keyVar]);
}

function authHeaders(path) {
  const p = provider(path);
  const key = process.env[p.keyVar];
  if (!key) {
    throw new Error(`${p.keyVar} missing. Copy .env.example to .env and add your key.`);
  }
  const h = {
    'content-type': 'application/json',
    authorization: `Bearer ${key}`,
  };
  // OpenRouter attributes traffic with these. Optional, but it is how the
  // request shows up as this project rather than as an anonymous script.
  if (p.name === 'openrouter') {
    h['HTTP-Referer'] = process.env.PUBLIC_URL || 'https://github.com/hearsay';
    h['X-Title'] = 'Hearsay';
  }
  return h;
}

/** Non-streaming completion. Returns text plus measured latency. */
export async function chat({ path = 'fast', model, messages, temperature = 0.7, max_tokens = 1024, reasoning_effort }) {
  const p = provider(path);
  const body = { model, messages, temperature, max_tokens };
  if (reasoning_effort) body.reasoning_effort = reasoning_effort;

  const t0 = Date.now();
  const r = await fetch(`${p.base}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(path),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${p.label} ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const j = await r.json();
  return {
    text: j.choices?.[0]?.message?.content ?? '',
    usage: j.usage ?? null,
    ms: Date.now() - t0,
  };
}

/**
 * Streaming completion that surfaces reasoning deltas separately from content.
 * This is what makes Grok 4.6's work visible in the dashboard — the whole
 * counter to "you just wrapped an API".
 *
 * onEvent({ type: 'reasoning' | 'content', text })
 */
export async function chatStream(
  { path = 'reason', model, messages, temperature = 0.4, max_tokens = 8192, reasoning_effort },
  onEvent,
) {
  const p = provider(path);
  const body = { model, messages, temperature, max_tokens, stream: true };
  if (reasoning_effort) body.reasoning_effort = reasoning_effort;

  const t0 = Date.now();
  const r = await fetch(`${p.base}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(path),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${p.label} ${r.status}: ${(await r.text()).slice(0, 400)}`);

  let content = '';
  let reasoning = '';
  let firstTokenMs = null;
  let buf = '';
  const dec = new TextDecoder();

  for await (const chunk of r.body) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let j;
      try { j = JSON.parse(payload); } catch { continue; }
      const d = j.choices?.[0]?.delta;
      if (!d) continue;

      // xAI has used both spellings across versions; accept either.
      const rd = d.reasoning_content ?? d.reasoning ?? '';
      if (rd) {
        if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
        reasoning += rd;
        onEvent?.({ type: 'reasoning', text: rd });
      }
      if (d.content) {
        if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
        content += d.content;
        onEvent?.({ type: 'content', text: d.content });
      }
    }
  }

  return { content, reasoning, ms: Date.now() - t0, firstTokenMs };
}

/** Models love to wrap JSON in fences. Dig it out without being precious. */
export function parseJson(text) {
  let s = String(text || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try { return JSON.parse(s); } catch { /* fall through */ }
  const start = s.search(/[{[]/);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch { /* fall through */ }
  }
  throw new Error(`Could not parse JSON from model output: ${s.slice(0, 200)}`);
}
