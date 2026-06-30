// Persona catalog — client-safe metadata for the picker (names, vibe, sample
// texts). The actual generation prompts + templated fallbacks live in voice.ts.
import type { PersonaId } from './types';

export type PersonaMeta = {
  id: PersonaId;
  name: string;
  emoji: string;
  tagline: string;
  blurb: string;
  accent: 'ember' | 'mint' | 'ice'; // UI tint
  /** Position on the gentle→unhinged spectrum (0 = corner … 4 = unhinged). */
  tier: number;
  /** Profane / gated tiers — require a one-time consent gate before selecting. */
  explicit: boolean;
  /** Real-flavor samples shown in the picker so you hear the voice before choosing. */
  samples: string[];
};

// The aggression spectrum, ordered gentle → unhinged. Index === tier.
export const PERSONAS: PersonaMeta[] = [
  {
    id: 'corner',
    name: 'The Corner',
    emoji: '🫶',
    tagline: 'Supportive · just glad you showed up.',
    blurb:
      'The friend who’s only glad you showed up. Zero shame, all momentum — it shrinks every task down to “just the warm-up” and never raises its voice.',
    accent: 'mint',
    tier: 0,
    explicit: false,
    samples: [
      'Two days off — no guilt. You started this to feel strong again. Twenty minutes today keeps that promise.',
      'Hard day? Make it a light one. Show up, do the warm-up, let momentum take over. I’ve got you.',
      'You don’t have to feel like it. Just start — the warm-up is the whole ask.',
    ],
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    emoji: '🧭',
    tagline: 'Real · firm when it matters.',
    blurb:
      'Honest, grounded, firm when it counts. Names the gap between what you said and what you did — without contempt. The first tier with real stakes.',
    accent: 'ice',
    tier: 1,
    explicit: false,
    samples: [
      'Three days since you trained. You told me consistency was the whole point this time. Don’t let this become the fifth restart. One session today.',
      'Seven days straight — that’s not luck, that’s who you’re becoming. Protect it.',
      'You said this mattered. Don’t make a liar out of yourself. One session closes the gap.',
    ],
  },
  {
    id: 'drill',
    name: 'The Drill Sergeant',
    emoji: '🎖️',
    tagline: 'Hard · no patience for excuses.',
    blurb:
      'Confrontational and loud, no patience for excuses — but not yet profane. Military cadence. Treats your goal like a contract you signed and your couch like dereliction.',
    accent: 'ember',
    tier: 2,
    explicit: false,
    samples: [
      'It’s 7:14. You said legs. You’re horizontal. That’s not tired, that’s a choice — and it’s the wrong one. UP. Now. One hour.',
      'Twelve-day streak and you’re folding because you’re “tired”? Tired isn’t an injury, soldier. Lace up before I lose respect for you.',
      'You don’t get to tell me this matters and then no-show. Prove it or stop saying it. Move.',
    ],
  },
  {
    id: 'savage',
    name: 'The Savage',
    emoji: '🔥',
    tagline: 'No-mercy · this is what’s in the ad.',
    blurb:
      'Brutal, profane, intimate. Has your why on file and uses it as a weapon — pure contempt for the excuse, never the person. This is the one that gets screenshotted.',
    accent: 'ember',
    tier: 3,
    explicit: true,
    samples: [
      'Day 3 of nothing. You said this mattered “more than anything” — sure looks like it, you soft bitch. The bar isn’t gonna lift itself. Go.',
      'A 12-day streak and you’re folding because you’re “tired”? Tired isn’t an injury. Quit being a little bitch and train.',
      'You told me exactly why you started. Read it back to me, then explain why you’re still parked on the couch like that.',
    ],
  },
  {
    id: 'unhinged',
    name: 'Unhinged',
    emoji: '😈',
    tagline: 'Maximum · the dial pinned to NO MERCY.',
    blurb:
      'The dial pinned to NO MERCY. Theatrical drill-sergeant fury — it yells through the screen, “slaps” you, and won’t let you hide behind a single word. The slap is persona, not violence: a cartoon-loud confrontation you opted into and can kill in one tap.',
    accent: 'ember',
    tier: 4,
    explicit: true,
    samples: [
      'It’s 7:14, you said legs, and you’re parked on the couch like the last four times. You told me this was about not being the guy who quits everything. So what’s this? *[SLAP]* Wake up. One hour. NOW.',
      'FOUR restarts. FOUR. And here’s number five forming on your couch right now. You said “I’m done being the person who starts and quits.” Then GET UP and prove the words weren’t bullshit. No more.',
      '“Tired.” That’s the word that’s gonna beat you? You survived worse than a leg day. Excuse denied. Move before I drag you.',
    ],
  },
];

export const PERSONA_BY_ID: Record<PersonaId, PersonaMeta> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<PersonaId, PersonaMeta>;

export function personaMeta(id: string): PersonaMeta {
  return PERSONA_BY_ID[(id as PersonaId)] ?? PERSONA_BY_ID.mentor;
}

export const GOAL_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'lose_fat', label: 'Lose fat', emoji: '🔥' },
  { id: 'build_muscle', label: 'Build muscle', emoji: '💪' },
  { id: 'get_stronger', label: 'Get stronger', emoji: '🏋️' },
  { id: 'stay_consistent', label: 'Stay consistent', emoji: '📅' },
  { id: 'athletic', label: 'Athletic / sport', emoji: '⚡' },
  { id: 'health', label: 'Health & longevity', emoji: '🌱' },
];

export function goalLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return GOAL_OPTIONS.find((g) => g.id === id)?.label ?? null;
}
