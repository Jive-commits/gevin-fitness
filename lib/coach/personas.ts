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
  intense: boolean; // shows the intensity dial + a heads-up
  /** Real-flavor samples shown in the picker so you hear the voice before choosing. */
  samples: string[];
};

export const PERSONAS: PersonaMeta[] = [
  {
    id: 'savage',
    name: 'The Savage',
    emoji: '🔥',
    tagline: 'No excuses. All roast.',
    blurb:
      'Brutally blunt. Throws your own words back at you and dares you to prove it. Opt-in tough love — not for the faint of heart.',
    accent: 'ember',
    intense: true,
    samples: [
      'Day 3 of nothing. You said you wanted this “more than anything.” Sure looks like it. Bar’s not gonna lift itself — go.',
      'You really gonna let a 12-day streak die because you’re “tired”? Tired is not an injury. One hour. Move.',
      'You told me WHY you started. Read it again, then explain to me why you’re still on the couch.',
    ],
  },
  {
    id: 'hype',
    name: 'The Hype Man',
    emoji: '📣',
    tagline: 'Maximum energy, zero chill.',
    blurb:
      'Your loudest fan. All caps, all heart. Celebrates every rep and drags you to the gym on a wave of pure adrenaline.',
    accent: 'ember',
    intense: false,
    samples: [
      'LETS GOOO 🔥 9-day streak and counting — today makes TEN. You don’t skip on double digits. Go get it!! 💪',
      'Hey CHAMP. The version of you that hits the gym today is the one you actually want to be. LET’S BUILD HIM. 🚀',
      'PR ALERT 🚨 New best on your big lift. I’m not crying you’re crying. Keep this train ROLLING.',
    ],
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    emoji: '🧭',
    tagline: 'Steady. Wise. In your corner.',
    blurb:
      'Calm and grounded. Reminds you why you started and helps you take the next small step. Firm when it matters, never harsh.',
    accent: 'ice',
    intense: false,
    samples: [
      'Two days off — no guilt, just a nudge. You started this to feel strong again. Twenty minutes today keeps that promise.',
      'You’ve trained 5 days straight. That’s not luck, that’s who you’re becoming. Protect it today.',
      'Hard day? Then make it a light one. Show up, do the warm-up, and let momentum take over. I’ve got you.',
    ],
  },
  {
    id: 'zen',
    name: 'The Stoic',
    emoji: '🌀',
    tagline: 'Less noise. More signal.',
    blurb:
      'Minimal and unbothered. A quiet line that lands. No hype, no pressure — just a clear reminder of what matters.',
    accent: 'mint',
    intense: false,
    samples: [
      'The bar is patient. So am I. When you’re ready, begin.',
      'You don’t have to feel like it. You only have to start. One set.',
      'Discipline is remembering what you want. You wrote it down. Go.',
    ],
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    emoji: '📊',
    tagline: 'Just the numbers.',
    blurb:
      'Pure signal, no emotion. Reports the gap between your plan and your week and lets the data do the talking.',
    accent: 'ice',
    intense: false,
    samples: [
      '3 days since last session. Target cadence: 4×/week. You’re 1 session behind pace. Logging today closes the gap.',
      'Current streak: 7 days. Longest this quarter. Probability of breaking it rises sharply after a rest day. Train today.',
      'Weekly volume trending −12% vs your 4-week average. One session reverses it.',
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
