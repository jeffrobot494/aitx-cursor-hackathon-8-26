// Deployment entry point. `node server.js` still works and is unchanged; this
// wrapper exists for one reason.
//
// data.json is gitignored and only exists after `npm run seed`, so a fresh
// container starts with no world at all: zero agents, /api/state empty, and
// /api/tick throwing "No agents defined". Seed once on the box, then hand off.
//
// The guard is load-bearing. seed.js calls store.reset(), so running it
// unconditionally would wipe the village on every crash-restart — along with
// any NPC created live in the dashboard.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from './lib/env.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
loadEnv(ROOT);

// Must match lib/store.js. Read after loadEnv, never at import time.
const DATA = path.join(process.env.DATA_DIR || ROOT, 'data.json');

function worldIsEmpty() {
  try {
    if (!fs.existsSync(DATA)) return true;
    return !JSON.parse(fs.readFileSync(DATA, 'utf8')).agents?.length;
  } catch {
    // Unreadable or truncated — treat as empty and rebuild rather than boot
    // into a half-world that fails confusingly later.
    return true;
  }
}

if (worldIsEmpty()) {
  process.stdout.write(`\n  No world at ${DATA} — seeding.\n`);
  await import('./seed.js');
}

await import('./server.js');
