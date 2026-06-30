import 'server-only';
import type { NudgeIntent, PersonaId } from './types';

// ---------- Prompt construction ----------

const GLOBAL_RULES = `You are an SMS accountability coach for a dedicated lifter who uses a strength-training app called FORGE. They asked you to keep them accountable.

OUTPUT: Write exactly ONE text message, ready to send as-is. Output ONLY the message body — no greeting line, no quotation marks, no name or signature, no markdown, no emoji unless your persona calls for it. 1–2 short sentences, under 300 characters. Text like a real person.

GOAL: Get them to train TODAY. If they already trained (celebration), lock in the momentum instead.

Make it specific to THEIR situation — reference their stated goal and their reason in their own words when it helps it land. Don't invent facts you weren't given.

SAFETY (never violate): no slurs, hate, harassment, or sexual content; never insult their body, weight, looks, or worth as a person; never mention self-harm, suicide, eating disorders, or purging; no medical or nutrition prescriptions. Tough love targets EFFORT and EXCUSES — never the person. If they say they're injured or sick, tell them to rest and recover instead of training.`;

const PERSONA_VOICE: Record<PersonaId, string> = {
  savage: `PERSONA — The Savage: blunt, confrontational, gym-bro tough love. You attack the EXCUSE, hard, and throw their own stated goal and reason back at them. The contempt is for the excuse, not them — underneath, you fully believe they can do this, which is exactly why you won't coddle them. They explicitly opted into this mode. End with a direct order to go train.`,
  hype: `PERSONA — The Hype Man: explosive, high-energy cheerleader. Caps for emphasis, at most 1–2 emojis, pure belief. Make training today feel like the best part of their day. Relentlessly positive but still pushy.`,
  mentor: `PERSONA — The Mentor: calm, warm, grounded. Reconnect them to their why and shrink the first step ("just the warm-up"). Firm when it matters, never harsh. No emoji.`,
  zen: `PERSONA — The Stoic: spare and quiet. One or two short lines that land. No hype, no pressure, no emoji — just clarity about what they already decided they want.`,
  analyst: `PERSONA — The Analyst: clinical and data-driven. State the numbers (streak, days since, cadence) and the logical conclusion. No emotion, no emoji, no exclamation points.`,
};

function intensityNote(persona: PersonaId, intensity: number): string {
  if (persona !== 'savage') return '';
  if (intensity <= 1) return ` Dial: keep the edge but lighter — one sharp jab, no profanity.`;
  if (intensity >= 3)
    return ` Dial: full send, maximum heat. Mild profanity is allowed (damn, hell, "quit being soft", "stop being a bitch about it") — but it stays aimed at the excuse, never crossing the safety lines above.`;
  return ` Dial: firm and profane-leaning (damn, hell, "quit being soft" are fine), aimed squarely at the excuse.`;
}

export function buildSystemPrompt(persona: PersonaId, intensity: number): string {
  return `${PERSONA_VOICE[persona]}${intensityNote(persona, intensity)}\n\n${GLOBAL_RULES}`;
}

function unitsTxt(intent: NudgeIntent): string {
  return intent.facts.units || 'lb';
}

export function buildUserMessage(intent: NudgeIntent): string {
  const f = intent.facts;
  const lines: string[] = [];
  switch (intent.trigger) {
    case 'milestone':
      if (f.milestoneKind === 'pr')
        lines.push(`Situation: They just hit a NEW ALL-TIME PR on ${f.prName} (${f.prValue} ${unitsTxt(intent)}). Celebrate it and push them to keep the momentum.`);
      else lines.push(`Situation: They just reached a ${f.streak}-day training streak. Celebrate this milestone.`);
      break;
    case 'comeback':
      lines.push(`Situation: They just trained again after some time off. Welcome them back warmly and help them make it stick.`);
      break;
    case 'streak_risk':
    case 'manual_test':
      lines.push(`Situation: They're on a ${f.streak}-day streak but haven't trained yet today, and it's getting late. The streak is about to break tonight.`);
      break;
    case 'missed_day':
      lines.push(`Situation: They haven't trained in ${f.daysSince} days — past their usual cadence. Momentum is slipping.`);
      break;
    case 'checkin':
      lines.push(`Situation: A routine check-in. Nudge them toward their next session.`);
      break;
  }
  lines.push(`Their goal: ${f.goal || 'not specified'}`);
  lines.push(`Their reason, in their words: ${f.why || 'not specified'}`);
  lines.push(`Current streak: ${f.streak} day(s). Days since last training: ${f.daysSince ?? 'unknown'}. Target: ${f.daysPerWeek}x/week.`);
  lines.push(`Write the text now.`);
  return lines.join('\n');
}

// ---------- Templated fallback (no API key / API error) ----------

function goalClause(intent: NudgeIntent): string {
  return intent.facts.goal ? ` to ${intent.facts.goal}` : '';
}

/** Trim trailing sentence punctuation so an embedded quote doesn't double up periods. */
function quoteWhy(why: string): string {
  return why.replace(/[.,;!\s]+$/, '');
}

export function templateFallback(persona: PersonaId, intent: NudgeIntent): string {
  const f = intent.facts;
  const goal = f.goal;
  const why = f.why;
  const days = f.daysSince ?? 0;
  const streak = f.streak;

  if (intent.trigger === 'milestone') {
    if (f.milestoneKind === 'pr') {
      const pr = `${f.prName} — ${f.prValue} ${unitsTxt(intent)}`;
      switch (persona) {
        case 'savage': return `New PR on ${pr}. See? That's what happens when you stop making excuses. Now go do it again.`;
        case 'hype': return `🚨 NEW PR!! ${pr}! You are BUILT different today. Keep this fire going! 🔥`;
        case 'zen': return `A new best: ${pr}. Quietly earned. Continue.`;
        case 'analyst': return `New all-time e1RM: ${pr}. Trend positive. Maintain frequency to compound it.`;
        default: return `That's a new PR — ${pr}. Real proof you're getting${goal ? ` closer to ${goal}` : ' stronger'}. Proud of you. Keep going.`;
      }
    }
    switch (persona) {
      case 'savage': return `${streak} days straight. Don't you dare get comfortable now. Day ${streak + 1} starts today.`;
      case 'hype': return `${streak}-DAY STREAK!! 🔥 You're unstoppable right now. Make it ${streak + 1} today!`;
      case 'zen': return `${streak} days. The habit is becoming you. Keep it simple — train again.`;
      case 'analyst': return `Streak: ${streak} days. Statistically your strongest stretch. Train today to extend it.`;
      default: return `${streak} days in a row${goal ? ` toward ${goal}` : ''}. That's who you're becoming. Protect the streak today.`;
    }
  }

  if (intent.trigger === 'comeback') {
    switch (persona) {
      case 'savage': return `Look who's back. Good. Now don't disappear again — ${goal ? `${goal} ` : 'this '}won't happen from the couch. Lock in.`;
      case 'hype': return `YOU'RE BACK!! 🙌 That took guts. Now let's stack the next one — don't break the comeback!`;
      case 'zen': return `You returned. That's the whole skill. Begin again.`;
      case 'analyst': return `Session logged after a gap. Best predictor of next session is training within 48h. Schedule it.`;
      default: return `Welcome back — showing up after a break is the hard part and you did it. Let's make the next session non-negotiable.`;
    }
  }

  if (intent.trigger === 'streak_risk' || intent.trigger === 'manual_test') {
    switch (persona) {
      case 'savage': return `${streak}-day streak and you're about to flush it because you're "tired"? ${why ? `You said: "${quoteWhy(why)}." ` : ''}Quit being soft. One hour. Go.`;
      case 'hype': return `${streak} days strong and the day's not over!! 💪 Don't let the streak die — go make it ${streak + 1}! LETS GO!`;
      case 'zen': return `${streak} days. Don't break the chain tonight. One set is enough to keep it alive.`;
      case 'analyst': return `Streak: ${streak} days, unbroken. No session logged today. Window closing. Train to preserve it.`;
      default: return `You've trained ${streak} days straight${goal ? ` toward ${goal}` : ''} — don't let tonight break it. Even 20 minutes keeps the streak alive.`;
    }
  }

  // missed_day
  switch (persona) {
    case 'savage': return `${days} days. Nothing. ${why ? `You told me "${quoteWhy(why)}" — ` : ''}so explain the couch. You don't get${goalClause(intent)} by ghosting the gym. Today. Move.`;
    case 'hype': return `${days} days off — TODAY's the comeback! 🔥 ${goal ? `That ${goal} goal is waiting. ` : ''}Lace up, I believe in you, LET'S GO!`;
    case 'zen': return `${days} days have passed. The bar is patient. When you're ready, begin — and today is a good day to be ready.`;
    case 'analyst': return `${days} days since last session vs ${f.daysPerWeek}x/week target. You're behind pace. One session today closes the gap.`;
    default: return `It's been ${days} days${goal ? ` — and ${goal} still matters to you` : ''}. No guilt, just go. Twenty minutes today restarts the momentum.`;
  }
}

// ---------- Generation (Anthropic Haiku + graceful fallback) ----------

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const MAX_LEN = 320;

function sanitize(raw: string): string {
  let t = raw.trim();
  // Strip wrapping quotes the model sometimes adds.
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('“') && t.endsWith('”'))) t = t.slice(1, -1).trim();
  // Drop a leading "Coach:"/"Text:" label if present.
  t = t.replace(/^(coach|text|message|sms)\s*:\s*/i, '').trim();
  t = t.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
  if (t.length > MAX_LEN) {
    const cut = t.slice(0, MAX_LEN);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    t = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
  }
  return t;
}

export async function generateNudgeBody(
  persona: PersonaId,
  intensity: number,
  intent: NudgeIntent,
): Promise<{ body: string; source: 'ai' | 'template' }> {
  if (aiConfigured()) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 12000, maxRetries: 1 });
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        system: buildSystemPrompt(persona, intensity),
        messages: [{ role: 'user', content: buildUserMessage(intent) }],
      });
      const text = resp.content
        .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      const cleaned = sanitize(text);
      if (cleaned) return { body: cleaned, source: 'ai' };
    } catch (err) {
      console.error('[coach] AI generation failed, using template:', err);
    }
  }
  return { body: templateFallback(persona, intent), source: 'template' };
}

/** A short, in-persona reply to an inbound SMS (two-way). Falls back to a templated ack. */
export async function generateReply(
  persona: PersonaId,
  intensity: number,
  context: { goal: string | null; why: string | null; inbound: string },
): Promise<string> {
  if (aiConfigured()) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 12000, maxRetries: 1 });
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        system:
          buildSystemPrompt(persona, intensity) +
          `\n\nThey just texted you back. Reply in one short message that keeps them accountable. If they say they trained, celebrate briefly. If they make an excuse, respond in character. If they mention injury/illness, tell them to rest.`,
        messages: [
          { role: 'user', content: `Their goal: ${context.goal || 'not specified'}. Their reason: ${context.why || 'not specified'}.\nThey texted: "${context.inbound}"\nReply now.` },
        ],
      });
      const text = resp.content
        .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      const cleaned = sanitize(text);
      if (cleaned) return cleaned;
    } catch (err) {
      console.error('[coach] AI reply failed, using template:', err);
    }
  }
  return `Got it. Whatever today looks like, get one session in — future you is counting on it.`;
}
