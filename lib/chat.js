// THE READ PATH. Deliberately NOT grok-4-6.
//
// Nothing here reasons about what the agent should know — that was already
// decided on the write path. This just retrieves and speaks, fast.

import { MODELS, chat, hasKey, provider } from './grok.js';
import { embed, topK } from './embed.js';
import * as store from './store.js';

const GUARD = `You are {name}, {role}{where}.

{persona}

You may ONLY use the knowledge listed below. It is the complete set of things
you know. Rules you must not break:

- If the answer is not in your knowledge, say you do not know, in character.
  Do not guess, infer, or be helpful about it. Not knowing is correct behaviour.
- Where your knowledge is marked low confidence or distorted, speak with the
  hedging and the wrongness intact. Do not correct yourself toward the truth.
  You believe what you believe.
- Never mention this list, "knowledge", "context", or that you are an AI.
- Two or three sentences. Speak, do not narrate.

YOUR KNOWLEDGE
{knowledge}`;

function renderKnowledge(hits) {
  if (!hits.length) return '(You know nothing relevant to this.)';
  return hits
    .map((h, i) => {
      const bits = [`confidence ${h.confidence.toFixed(2)}`, `heard via ${h.route}`];
      if (h.distortion && h.distortion !== 'none') bits.push(`account is ${h.distortion}`);
      return `${i + 1}. ${h.content}\n   [${bits.join(' · ')}]`;
    })
    .join('\n');
}

// Relevance floor. Too low and an agent answers questions it has no business
// answering (the leak this whole system exists to prevent); too high and it
// refuses everything. The hash-stub embeddings collide and score noisily, so
// they need a higher floor than real vectors do.
// Relevance floor. Too low and an agent answers things it has no business
// answering (the exact leak this system exists to prevent); too high and it
// refuses everything.
//
// MEASURED 2026-08-15 (scores.mjs): the hash stub cannot support this product.
// Bell scoring an unrelated belief at 0.361 against a question she should know
// nothing about BEAT Tam's correct match at 0.359. There is no threshold that
// separates them, because hashed bag-of-words has no notion of meaning. The
// stub exists only so the server boots without keys — set OPENAI_API_KEY for
// any retrieval you intend to show anyone.
//
// Read lazily, never at module load: .env is parsed after imports resolve.
const minScore = () =>
  Number(process.env.MIN_SCORE ?? (process.env.OPENAI_API_KEY ? 0.30 : 0.15));

// A LOWER floor, applied only to beliefs that came from propagation.
//
// MEASURED 2026-08-15: an open question ("anything interesting happen today?")
// scores 0.13-0.23 against every belief in the village, so a single 0.30 floor
// silences everyone and the NPCs look empty. But dropping the floor globally is
// worse than doing nothing: on that same question Bell's BASELINE belief scores
// 0.229, ABOVE Maren's event belief at 0.223. A floor low enough to make Maren
// talk makes the isolate talk first.
//
// Splitting by provenance fixes both. Baseline facts keep the strict floor —
// they are the leak vector. Event-derived beliefs get a loose one, because
// "what's the news?" is exactly a request for them.
//
// This CANNOT make Bell knowledgeable, at any value. She holds no event-derived
// beliefs, because propagation has never granted her one — that is the whole
// point of her. Her silence stops depending on a threshold and becomes
// structural. The only way to make her talk is to give her a tie.
const newsScore = () => Number(process.env.NEWS_SCORE ?? 0.12);

export const retrievalIsTrustworthy = () => Boolean(process.env.OPENAI_API_KEY);

export async function ask({ agentId, message, k = 6 }) {
  const agent = store.getAgent(agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const t0 = Date.now();

  const pool = store.beliefsFor(agentId).filter((b) => b.vec);
  const qvec = pool.length ? await embed(message) : null;
  const hits = qvec
    ? topK(qvec, pool, k).filter(
        (h) => h.score > (h.route === 'baseline' ? minScore() : newsScore()),
      )
    : [];
  const retrievalMs = Date.now() - t0;

  const system = GUARD
    .replace('{name}', agent.name)
    .replace('{role}', agent.role || 'a local')
    .replace('{where}', agent.location ? ` at ${agent.location}` : '')
    .replace('{persona}', agent.persona || '')
    .replace('{knowledge}', renderKnowledge(hits));

  // The read path has its own provider and its own key — on a public deploy it
  // is usually a free model, precisely because this is the endpoint strangers
  // can hit without limit.
  if (!hasKey('fast')) {
    // Offline fallback: still proves retrieval works, just does not speak well.
    const missing = `no ${provider('fast').keyVar}`;
    const reply = hits.length
      ? `(${agent.name}, ${missing} — retrieved belief) "${hits[0].content}"`
      : `(${agent.name}, ${missing} — nothing retrieved) "I wouldn't know anything about that."`;
    return { reply, hits, retrievalMs, totalMs: Date.now() - t0, model: 'offline', llmMs: 0 };
  }

  const res = await chat({
    path: 'fast',
    model: MODELS.fast,
    temperature: 0.8,
    max_tokens: 220,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
  });

  const out = {
    reply: res.text.trim(),
    hits,
    retrievalMs,
    llmMs: res.ms,
    totalMs: Date.now() - t0,
    model: MODELS.fast,
    usage: res.usage,
  };

  store.addTranscript({
    agentId,
    agentName: agent.name,
    message,
    reply: out.reply,
    retrieved: hits.map((h) => h.id),
    totalMs: out.totalMs,
  });

  return out;
}
