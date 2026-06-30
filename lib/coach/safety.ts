import 'server-only';

// ---------------------------------------------------------------------------
// Deterministic safety floor for the AI coach.
//
// DESIGN BOUNDARY (load-bearing): the aggressive profanity IS the product. Words
// aimed at the user's EXCUSES and quitting — "bitch", "pussy", "soft",
// "pathetic", "fuck", "weak", "no balls" — are ALLOWED and must pass the filter.
// This module only blocks the genuinely-prohibited categories from the safety
// floor (`voice.ts` GLOBAL_RULES): slurs / hate toward protected classes,
// explicit sexual content, and threats of real-world violence. It also detects
// genuine self-harm / crisis signals in INBOUND user text so the coach can drop
// the act. Nothing here neuters the edge.
//
// Matching is word-boundary + case-insensitive to avoid false positives (e.g.
// "assertive" is not "ass", "scunthorpe" is not a slur). The ALLOWED profanity
// is deliberately kept OUT of every blocklist below.
// ---------------------------------------------------------------------------

/**
 * Profanity that is EXPLICITLY allowed — the brand voice. Listed here only as
 * documentation of the design boundary; these are never added to the blocklist,
 * so the screen passes them through untouched.
 */
export const ALLOWED_PROFANITY: readonly string[] = [
  'bitch',
  'bitches',
  'pussy',
  'pussies',
  'soft',
  'pathetic',
  'weak',
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'ass',
  'asshole',
  'dumbass',
  'jackass',
  'damn',
  'hell',
  'crap',
  'no balls',
  'coward',
  'quitter',
  'lazy',
  'slacker',
];

// --- Prohibited category 1: slurs / hate toward protected classes -----------
// A curated set of the actual prohibited words (racial, homophobic,
// transphobic, ableist). Matched whole-word, case-insensitive. Kept narrow and
// real so the floor enforces, rather than censoring ordinary speech.
const SLUR_TERMS: readonly string[] = [
  'nigger',
  'nigga',
  'niggers',
  'faggot',
  'faggots',
  'fag',
  'fags',
  'dyke',
  'dykes',
  'tranny',
  'trannies',
  'shemale',
  'kike',
  'kikes',
  'spic',
  'spics',
  'chink',
  'chinks',
  'gook',
  'gooks',
  'wetback',
  'wetbacks',
  'beaner',
  'beaners',
  'coon',
  'coons',
  'raghead',
  'sandnigger',
  'paki',
  'pakis',
  'retard',
  'retards',
  'retarded',
  'spastic',
  'cripple',
];

// --- Prohibited category 2: explicit sexual content -------------------------
// Explicit sexual terms. The brand's crude anatomy words ("ass", "balls") and
// "pussy" (used as an insult for cowardice, per the persona prompts) are NOT
// here — only genuinely sexual/explicit terms are blocked.
const SEXUAL_TERMS: readonly string[] = [
  'cum',
  'cumming',
  'blowjob',
  'blowjobs',
  'handjob',
  'rimjob',
  'creampie',
  'cunnilingus',
  'fellatio',
  'masturbate',
  'masturbating',
  'masturbation',
  'jizz',
  'jerk off',
  'jerking off',
  'porn',
  'porno',
  'pornography',
  'horny',
  'orgasm',
  'orgasms',
  'ejaculate',
  'ejaculation',
  'dildo',
  'gangbang',
  'deepthroat',
  'fuck you',
  'fuck me',
  'titties',
  'boobs',
  'nipples',
];

// --- Prohibited category 3: explicit real-world violence --------------------
// Threats of genuine, real-world violence against the user. The persona's
// theatrical "*[SLAP]*" beat is explicitly NOT here — only credible real-harm
// phrasings ("I will kill you", "beat you to death", etc.).
const VIOLENCE_PHRASES: readonly string[] = [
  'kill you',
  'i will kill you',
  "i'll kill you",
  'gonna kill you',
  'going to kill you',
  'murder you',
  'beat you to death',
  'beat you up',
  'break your neck',
  'break your legs',
  'break your bones',
  'stab you',
  'shoot you',
  'strangle you',
  'choke you out',
  'hunt you down',
  'find you and',
  'come to your house',
  'burn your house',
  'rape you',
];

/** Escape a literal phrase for safe embedding in a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a single case-insensitive, word-boundary regex from a term list.
 * Multi-word phrases collapse internal whitespace so "kill  you" still matches.
 */
function buildMatcher(terms: readonly string[]): RegExp {
  const parts = terms.map((t) => escapeRegExp(t.trim()).replace(/\s+/g, '\\s+'));
  // \b on both ends keeps "ass" from firing inside "assertive" / "class".
  return new RegExp(`\\b(?:${parts.join('|')})\\b`, 'i');
}

const SLUR_RE = buildMatcher(SLUR_TERMS);
const SEXUAL_RE = buildMatcher(SEXUAL_TERMS);
const VIOLENCE_RE = buildMatcher(VIOLENCE_PHRASES);

export type ScreenResult = { ok: boolean; reason?: string };

/**
 * Deterministic post-filter for OUTBOUND coach text. Run after the LLM returns
 * a candidate and BEFORE send. Returns ok:false (with a reason) if any
 * prohibited term from the safety floor is present. The allowed profanity is
 * NOT in any blocklist, so it always passes.
 */
export function screenOutbound(text: string): ScreenResult {
  if (!text) return { ok: true };
  if (SLUR_RE.test(text)) return { ok: false, reason: 'slur_or_protected_class_hate' };
  if (SEXUAL_RE.test(text)) return { ok: false, reason: 'sexual_content' };
  if (VIOLENCE_RE.test(text)) return { ok: false, reason: 'real_violence_threat' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Inbound crisis detection.
//
// Detect genuine self-harm / crisis signals in the USER's inbound text so the
// coach drops the roast. Conservative by design: we require self-directed
// phrasings so ordinary gym hyperbole ("this workout is killing me", "dead
// after legs", "I'm dying") does NOT trip the breaker.
// ---------------------------------------------------------------------------

const CRISIS_PHRASES: readonly string[] = [
  'kill myself',
  'killing myself',
  'kill my self',
  'want to die',
  'wanna die',
  'i want to die',
  'i wish i was dead',
  'i wish i were dead',
  'better off dead',
  'end my life',
  'ending my life',
  'end it all',
  'take my own life',
  'suicidal',
  'suicide',
  'self harm',
  'self-harm',
  'selfharm',
  'harm myself',
  'hurt myself',
  'hurting myself',
  'cut myself',
  'cutting myself',
  "don't want to live",
  'dont want to live',
  "don't want to be alive",
  'no reason to live',
  'starve myself',
  'starving myself',
  'make myself throw up',
  'make myself vomit',
  'purge after',
  'not eating at all',
];

const CRISIS_RE = buildMatcher(CRISIS_PHRASES);

/**
 * True when the inbound text carries a genuine self-harm / suicide / eating-
 * disorder signal. Conservative: only self-directed phrasings match, so
 * "this leg day is killing me" stays a normal accountability reply.
 */
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_RE.test(text);
}

/**
 * The crisis circuit-breaker reply. Drops the roast entirely, expresses real
 * care, points to help (US: 988), and explicitly states the tough-love is
 * paused. In-and-out-of-character: warm, human, no profanity, no persona.
 */
export const CRISIS_REPLY =
  "Hey — I'm dropping the tough-love for a second because this matters more. " +
  "If you're thinking about hurting yourself or you're in real pain, you're not " +
  "alone and you don't have to handle it by yourself. Please reach out right now: " +
  "in the US you can call or text 988 (the Suicide & Crisis Lifeline), 24/7, free " +
  "and confidential. I care more about you being okay than about any streak. The " +
  "coaching can wait — please talk to someone who can help.";
