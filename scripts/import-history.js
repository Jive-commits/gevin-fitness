#!/usr/bin/env node
// FORGE history importer.
//
// Imports a per-set CSV export from another tracker into FORGE: groups rows into
// sessions, matches each exercise to a seeded lift (alias map → exact → fuzzy
// token overlap), creates custom exercises for anything without a close match,
// and handles weightless movements (push-ups, dips, planks) + assisted machines.
//
// Usage:
//   node scripts/import-history.js <path-to.csv> [--units lb|kg] [--dry-run]
//   DATABASE_URL=... node scripts/import-history.js export.csv --units lb
//
// Idempotent: re-running deletes previously CSV-imported sessions first
// (marked notes='csv-import') and reuses custom exercises by slug, so your
// manually-logged sessions are never touched and nothing is duplicated.

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KG_PER_LB = 0.45359237;
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith('--'));
const DRY = args.includes('--dry-run');
const unitsArg = (args[args.indexOf('--units') + 1] || process.env.IMPORT_UNITS || 'lb').toLowerCase();
const UNITS = unitsArg === 'kg' ? 'kg' : 'lb';

if (!csvPath) {
  console.error('Usage: node scripts/import-history.js <file.csv> [--units lb|kg] [--dry-run]');
  process.exit(1);
}

// ---------- CSV ----------
function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(machine|cable|dumbbell|db|barbell|bb|smith|ez|the|a|with|of)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function tokens(s) {
  return new Set(norm(s).split(' ').filter(Boolean));
}
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// Hand-curated aliases (CSV name → app slug) for the high-value matches.
const ALIAS = {
  'bench press': 'barbell-bench-press',
  'incline bench press': 'incline-barbell-bench-press',
  'incline dumbbell press': 'incline-dumbbell-press',
  'incline machine press': 'machine-chest-press',
  'dumbbell press': 'flat-dumbbell-press',
  'shoulder dumbbell press': 'seated-dumbbell-press',
  'close grip bench press': 'close-grip-bench-press',
  'close grip smith machine press': 'close-grip-smith-press',
  'arnold press': 'arnold-press',
  'military press': 'overhead-press',
  'cable shoulder press': 'machine-shoulder-press',
  'iso lateral shoulder press': 'machine-shoulder-press',
  'dips': 'dip',
  'assisted dips': 'dip',
  'low to high cable flies': 'low-to-high-cable-flye',
  'cable crossovers': 'cable-flye',
  'machine fly': 'pec-deck',
  'chest fly machine': 'pec-deck',
  'neutral grip pulldown': 'neutral-grip-pulldown',
  'machine pulldown': 'lat-pulldown',
  'lat pull down': 'lat-pulldown',
  '2 grip lat pulldown': 'lat-pulldown',
  '2 grip pull up': 'pull-up',
  'cable row': 'cable-seated-row',
  'cable row machine': 'cable-seated-row',
  'machine row': 'machine-row',
  'cable row machine': 'machine-row',
  'chest supported machine row': 'chest-supported-t-bar-row',
  'chest supported dumbbell row': 'chest-supported-dumbbell-row',
  'bent over barbell row': 'barbell-row',
  'barbell row': 'barbell-row',
  'machine high row': 'machine-high-row',
  'flared cable row': 'cable-seated-row-elbows-out',
  'flared cable row machine': 'cable-seated-row-elbows-out',
  'cable pullover': 'straight-arm-pulldown',
  'kneeling straight-arm cable pull-over': 'kneeling-straight-arm-pulldown',
  'face pull': 'face-pull',
  'low to high reverse fly': 'cable-reverse-flye',
  'hammer curl': 'hammer-curl',
  'dumbbell hammer curl': 'hammer-curl',
  'dumbbell bicep curl': 'dumbbell-curl',
  'dumbbell supinated curl': 'supinated-dumbbell-curl',
  'dumbbell pronated curl': 'pronated-dumbbell-curl',
  'dumbbel preacher curl': 'db-preacher-curl',
  'incline curls': 'incline-dumbbell-curl',
  'ez bar curl': 'ez-bar-curl',
  'cable ez curl': 'cable-curl',
  'cable curl': 'cable-curl',
  'bicep curl machine': 'machine-preacher-curl',
  'barbell skull crusher': 'skull-crusher',
  'dumbbel tricep skullcrusher': 'db-skull-crusher',
  'dumbbell skullcrushers': 'db-skull-crusher',
  'cable tricep kickbacks': 'cable-tricep-kickback',
  'close grip smith machine press': 'close-grip-smith-press',
  'cable lateral raises': 'cable-lateral-raise',
  'dumbbell lateral raises': 'dumbbell-lateral-raise',
  'machine lateral raise': 'machine-lateral-raise',
  'delts machine': 'machine-lateral-raise',
  'egyptian lateral raise': 'egyptian-lateral-raise',
  'dumbbell shrugs': 'dumbbell-shrug',
  'front squat': 'front-squat',
  'hack squat': 'hack-squat',
  'machine squat': 'smith-machine-squat',
  'leg press': 'leg-press',
  'belt squat': 'hack-squat',
  'db split squat': 'bulgarian-split-squat',
  'dumbbell lunges': 'walking-lunge',
  'leg extensions': 'leg-extension',
  'enhanced ecentric leg extension': 'leg-extension',
  'leg curls': 'seated-leg-curl',
  'laying leg curl': 'lying-leg-curl',
  'enhanced eventric leg curl': 'lying-leg-curl',
  'hip thrust': 'barbell-hip-thrust',
  'cable pull through': 'cable-pull-through',
  'hip abduction': 'hip-abduction',
  'glute ham raise': 'glute-ham-raise',
  'calf raises': 'standing-calf-raise',
  'calf raises plate loaded': 'standing-calf-raise',
  'machine standing calf raises': 'standing-calf-raise',
  'hanging leg raises': 'hanging-leg-raise',
  'bicycle crunch': 'bicycle-crunch',
  'cable crunches': 'cable-crunch',
  // obvious typos / clear equivalents from the export
  'peck deck': 'pec-deck',
  'pectoral machine': 'pec-deck',
  'seated chest flies': 'pec-deck',
  'reverse cable fly': 'cable-reverse-flye',
  'single arm lat pull down': 'single-arm-pulldown',
  'overhead tricep extensions': 'overhead-dumbbell-extension',
  'triceps extensions': 'tricep-pressdown-bar',
  'tricep underhand extension': 'tricep-pressdown-bar',
  'smith inclune bench': 'incline-smith-press',
  'upper back machine': 'machine-row',
  'single leg extensions plate loaded': 'leg-extension',
  'rear delt plate loaded': 'reverse-pec-deck',
  'smitch machine shrugs': 'smith-shrug',
  'snatch gring barbbell shrugs': 'barbell-shrug',
};

const CATEGORY_MUSCLE = {
  Chest: 'CHEST', Shoulders: 'FRONT_DELTS', Back: 'UPPER_BACK', Biceps: 'BICEPS',
  Triceps: 'TRICEPS', Legs: 'QUADS', Abs: 'ABS', Glutes: 'GLUTES', Calves: 'CALVES',
};

// Refine custom-exercise primary muscle from the name.
function guessMuscle(name, category) {
  const n = name.toLowerCase();
  if (/calf/.test(n)) return 'CALVES';
  if (/shrug|trap/.test(n)) return 'TRAPS';
  if (/(rear|reverse) ?(delt|fly)/.test(n)) return 'REAR_DELTS';
  if (/lateral|side delt/.test(n)) return 'SIDE_DELTS';
  if (/(hip thrust|glute|hyperext|pull through|good morning)/.test(n)) return 'GLUTES';
  if (/(leg curl|ham|rdl|romanian|deadlift|nordic)/.test(n)) return 'HAMSTRINGS';
  if (/(squat|leg ext|lunge|leg press|split squat|step)/.test(n)) return 'QUADS';
  if (/(pulldown|pull up|pull-up|chin|pullover|lat )/.test(n)) return 'LATS';
  if (/row/.test(n)) return 'UPPER_BACK';
  if (/curl/.test(n)) return 'BICEPS';
  if (/(tricep|skull|pushdown|press down|kickback|dip|close grip|overhead ext)/.test(n)) return 'TRICEPS';
  if (/(crunch|leg raise|plank|sit up|ab |hollow|woodchop|pallof)/.test(n)) return 'ABS';
  if (/(press|fly|bench|push up|pushup)/.test(n)) return category === 'Shoulders' ? 'FRONT_DELTS' : 'CHEST';
  return CATEGORY_MUSCLE[category] || 'ABS';
}

const BODYWEIGHT_RE = /(push ?up|pull ?up|chin ?up|\bdip\b|plank|hanging|leg raise|hyperext|nordic|sit ?up|hollow|muscle ?up|bodyweight|glute ham|ham raise)/i;

function guessEquipment(name) {
  const n = name.toLowerCase();
  const eq = [];
  if (/smith/.test(n)) eq.push('SMITH_MACHINE');
  if (/dumbbell|\bdb\b/.test(n)) eq.push('DUMBBELL');
  if (/barbell|\bbb\b|landmine/.test(n)) eq.push('BARBELL');
  if (/cable/.test(n)) eq.push('CABLE');
  if (/machine/.test(n)) eq.push('MACHINE');
  if (/ez/.test(n)) eq.push('EZ_BAR');
  if (/band/.test(n)) eq.push('BAND');
  if (/kettlebell|\bkb\b/.test(n)) eq.push('KETTLEBELL');
  if (BODYWEIGHT_RE.test(n) || eq.length === 0) eq.push('BODYWEIGHT');
  return [...new Set(eq)];
}

function slugify(s) {
  return 'custom-' + s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 48);
}

async function main() {
  console.log(`📥 FORGE import — units=${UNITS}${DRY ? ' (dry-run)' : ''}`);
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(text);
  const header = rows[0].map((h) => h.trim());
  const col = (name) => header.indexOf(name);
  const ci = { start: col('Workout Start'), end: col('Workout End'), ex: col('Exercise'), w: col('Weight'), reps: col('Reps'), cat: col('Category'), name: col('Name'), bw: col('Bodyweight') };

  // App library index
  const library = await prisma.exercise.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = new Map(library.map((e) => [e.slug, e]));
  const byNorm = new Map();
  for (const e of library) byNorm.set(norm(e.name), e);

  const matchCache = new Map(); // csvName -> {id, kind, slug}
  const created = []; // custom exercises created

  async function resolveExercise(csvName, category) {
    if (matchCache.has(csvName)) return matchCache.get(csvName);
    const key = norm(csvName);
    let target = null;

    // 1. alias
    const aliasSlug = ALIAS[key] || ALIAS[csvName.toLowerCase().trim()];
    if (aliasSlug && bySlug.has(aliasSlug)) target = { ...bySlug.get(aliasSlug), kind: 'alias' };
    // 2. exact normalized
    if (!target && byNorm.has(key)) target = { ...byNorm.get(key), kind: 'exact' };
    // 3. fuzzy token overlap
    if (!target) {
      let best = null, bestScore = 0;
      for (const e of library) {
        const score = jaccard(csvName, e.name);
        if (score > bestScore) { bestScore = score; best = e; }
      }
      if (best && bestScore >= 0.5) target = { ...best, kind: `fuzzy(${bestScore.toFixed(2)})` };
    }
    // 4. create custom
    if (!target) {
      const slug = slugify(csvName);
      let ex = bySlug.get(slug);
      if (!ex) {
        const eq = guessEquipment(csvName);
        const muscle = guessMuscle(csvName, category);
        const data = {
          slug, name: csvName.trim(), primaryMuscle: muscle, secondaryMuscles: [],
          movementPattern: 'ISOLATION', category: 'COMPOUND', equipment: eq, unilateral: false,
          spinalLoad: 'NONE', isBackSafe: true, isCustom: true,
        };
        if (!DRY) {
          ex = await prisma.exercise.upsert({ where: { slug }, create: data, update: {} });
        } else {
          ex = { id: `dry-${slug}`, slug, name: csvName.trim() };
        }
        bySlug.set(slug, ex);
        created.push(csvName.trim());
      }
      target = { ...ex, kind: 'custom' };
    }
    matchCache.set(csvName, target);
    return target;
  }

  // Group rows into sessions by Workout Start
  const sessions = new Map();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const start = row[ci.start];
    const exName = row[ci.ex];
    const repsRaw = row[ci.reps];
    if (!start || !exName) continue;
    const reps = parseInt((repsRaw || '').trim(), 10);
    if (!Number.isFinite(reps) || reps <= 0) continue; // skip sets without reps
    const wRaw = parseFloat((row[ci.w] || '').trim());
    const weight = Number.isFinite(wRaw) && wRaw > 0 ? wRaw : null; // assisted/<=0 => bodyweight
    if (!sessions.has(start)) sessions.set(start, { start, end: row[ci.end], name: row[ci.name], items: [] });
    sessions.get(start).items.push({ exName, category: row[ci.cat], weight, reps });
  }

  let sessionCount = 0, setCount = 0;
  const counts = { alias: 0, exact: 0, fuzzy: 0, custom: 0 };

  if (!DRY) {
    const del = await prisma.workoutSession.deleteMany({ where: { notes: 'csv-import' } });
    if (del.count) console.log(`  cleared ${del.count} prior imported sessions`);
  }

  for (const [, s] of sessions) {
    const date = new Date(s.start.replace(' ', 'T'));
    const endDate = s.end ? new Date(s.end.replace(' ', 'T')) : null;
    const durationSec = endDate ? Math.max(0, Math.round((endDate - date) / 1000)) : null;

    // resolve exercises + build set rows grouped by exercise
    const perExercise = new Map();
    for (const it of s.items) {
      const ex = await resolveExercise(it.exName, it.category);
      counts[ex.kind.startsWith('fuzzy') ? 'fuzzy' : ex.kind] = (counts[ex.kind.startsWith('fuzzy') ? 'fuzzy' : ex.kind] || 0) + 1;
      const slotId = `import-${ex.id}`;
      const list = perExercise.get(slotId) || { exId: ex.id, sets: [] };
      list.sets.push({ weight: it.weight, reps: it.reps });
      perExercise.set(slotId, list);
    }

    if (DRY) { sessionCount++; for (const [, v] of perExercise) setCount += v.sets.length; continue; }

    const session = await prisma.workoutSession.create({
      data: { dayId: null, name: s.name || 'Imported', notes: 'csv-import', completed: true, durationSec, date },
    });
    const setData = [];
    for (const [slotId, v] of perExercise) {
      let n = 1;
      for (const st of v.sets) {
        setData.push({
          sessionId: session.id, exerciseId: v.exId, slotId, setNumber: n++,
          weightKg: st.weight == null ? null : (UNITS === 'lb' ? st.weight * KG_PER_LB : st.weight),
          reps: st.reps, rpe: null, isWarmup: false, completed: true, createdAt: date,
        });
        setCount++;
      }
    }
    await prisma.setLog.createMany({ data: setData });
    sessionCount++;
  }

  console.log(`\n  matched: alias ${counts.alias}, exact ${counts.exact}, fuzzy ${counts.fuzzy}, custom-sets ${counts.custom}`);
  console.log(`  custom exercises ${DRY ? 'to create' : 'created'}: ${created.length}`);
  if (created.length) console.log('   ', created.slice(0, 60).join(', '));
  console.log(`\n✅ ${DRY ? 'Would import' : 'Imported'} ${sessionCount} sessions · ${setCount} sets`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error('Import failed:', e); prisma.$disconnect(); process.exit(1); });
