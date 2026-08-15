// Without loadEnv this reads no .env, so the QUERY gets stub-embedded (256d)
// while stored beliefs are OpenAI vectors (1536d) — cosine() returns 0 on a
// length mismatch and every score prints 0.000. Looks like broken retrieval.
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadEnv} from "./lib/env.js";
loadEnv(path.dirname(fileURLToPath(import.meta.url)));

import * as store from "./lib/store.js";
import {embed,topK,embedProvider} from "./lib/embed.js";
console.log("embeddings: "+embedProvider());
for (const [who,q] of [["agent_tam","tell me about couriers and their horses"],["agent_bell","what happened to the dispatch pouch on the north road"],["agent_maren","is there enough barley"]]) {
  const pool=store.beliefsFor(who).filter(b=>b.vec);
  const qv=await embed(q);
  console.log("\n"+store.getAgent(who).name+": "+q);
  for (const h of topK(qv,pool,5)) console.log("   "+h.score.toFixed(3)+"  "+h.content.slice(0,64));
}
