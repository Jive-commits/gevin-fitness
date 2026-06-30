#!/usr/bin/env node
// Regenerate lib/exercise-media.ts: match the seeded library to the public-domain
// free-exercise-db (yuhonas/free-exercise-db, Unlicense) and store each lift's two
// demonstration frames. Run: node scripts/gen-exercise-media.js
const fs = require('fs');
const path = require('path');
const { exercises } = require(path.join(__dirname, '..', 'prisma', 'seed-data', 'exercises.js'));

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const STOP = new Set(['the', 'a', 'with', 'of', 'grip', 'medium', 'to', 'and', 'machine', 'barbell', 'dumbbell', 'db', 'bb', 'cable']);
const toks = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t && !STOP.has(t)));
function jac(a, b) {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const t of A) if (B.has(t)) i++;
  return i / (A.size + B.size - i);
}
const MM = { CHEST: 'chest', QUADS: 'quadriceps', HAMSTRINGS: 'hamstrings', GLUTES: 'glutes', CALVES: 'calves', LATS: 'lats', UPPER_BACK: 'middle back', TRAPS: 'traps', FRONT_DELTS: 'shoulders', SIDE_DELTS: 'shoulders', REAR_DELTS: 'shoulders', BICEPS: 'biceps', TRICEPS: 'triceps', FOREARMS: 'forearms', ABS: 'abdominals', OBLIQUES: 'abdominals' };

async function main() {
  const free = await fetch(SRC).then((r) => r.json());
  const out = {};
  let matched = 0;
  for (const ex of exercises) {
    let best = null, bestScore = 0;
    const want = MM[ex.primaryMuscle];
    for (const f of free) {
      if (!f.images || !f.images.length) continue;
      let s = jac(ex.name, f.name);
      if (want && (f.primaryMuscles || []).includes(want)) s += 0.12;
      if (s > bestScore) { bestScore = s; best = f; }
    }
    if (best && bestScore >= 0.34) {
      out[ex.slug] = best.images.slice(0, 2).map((p) => BASE + p);
      matched++;
    }
  }
  const header =
    '// Auto-generated from yuhonas/free-exercise-db (Unlicense / public domain).\n' +
    '// slug -> [startFrame, endFrame] image URLs; alternated to animate the movement.\n' +
    '// Regenerate: node scripts/gen-exercise-media.js\n';
  fs.writeFileSync(
    path.join(__dirname, '..', 'lib', 'exercise-media.ts'),
    header + 'export const EXERCISE_MEDIA: Record<string, string[]> = ' + JSON.stringify(out, null, 2) + ';\n',
  );
  console.log(`matched ${matched}/${exercises.length} exercises`);
}
main().catch((e) => { console.error(e); process.exit(1); });
