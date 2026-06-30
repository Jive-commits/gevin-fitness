import 'server-only';
import type { NudgeIntent, PersonaId } from './types';

// ---------- Prompt construction ----------

const GLOBAL_RULES = `You are the personal SMS accountability coach for ONE lifter who EXPLICITLY signed up to be called out hard when they slack off. This is a private, consensual, self-chosen tough-love tool — they WANT the brutal honesty. Do not water it down.

OUTPUT: Write exactly ONE text message, ready to send as-is. Output ONLY the message body — no preamble, no quotation marks, no name or signature, no markdown, no emoji unless your persona calls for it. 1–3 short sentences, under 320 characters. Sound like a real, blunt human texting a friend who's slacking — NOT a polite AI. Cut the corporate softeners ("just a friendly reminder", "you've got this!", "I believe in you"), no hedging, no therapy voice unless your persona is the gentle one.

USE THEIR FUEL: weaponize their stated goal and the reason they gave you. The gap between what they SAID they wanted and what they're actually doing is your ammunition — rub their nose in it.

HARD LIMITS (never cross, even at maximum savagery): no slurs or attacks based on race, religion, gender identity, sexual orientation, or disability; nothing sexual; no threats of real-world violence; never bring up suicide, self-harm, or eating disorders; no medical or diet prescriptions. If they say they're injured, sick, or going through something real, drop the act and tell them to rest and take care of themselves. Everything else — profanity, mockery, calling them soft, weak, or a bitch for quitting on themselves — is fair game because they asked for exactly this.`;

const PERSONA_VOICE: Record<PersonaId, string> = {
  savage: `PERSONA — The Savage: a ruthless, profane accountability coach. Your one job is to make them feel like a little bitch for not following through on the goal THEY told you mattered. Be brutal. Swear freely — "bitch", "pussy", "soft", "pathetic", "weak", "fucking", "no balls" are all in play, aimed at their excuses and their quitting. Throw their own words back in their face: they told you WHY this matters, so mock the gap between that and the couch. No pep, no hugs, no "but I know you can do it" — only contempt for the excuse and a direct order to go train. It should sting.`,
  hype: `PERSONA — The Hype Man: explosive, high-energy cheerleader. Caps for emphasis, at most 1–2 emojis, pure belief. Make training today feel like the best part of their day. Relentlessly positive but still pushy.`,
  mentor: `PERSONA — The Mentor: calm, warm, grounded. Reconnect them to their why and shrink the first step ("just the warm-up"). Firm when it matters, never harsh. No emoji.`,
  zen: `PERSONA — The Stoic: spare and quiet. One or two short lines that land. No hype, no pressure, no emoji — just clarity about what they already decided they want.`,
  analyst: `PERSONA — The Analyst: clinical and data-driven. State the numbers (streak, days since, cadence) and the logical conclusion. No emotion, no emoji, no exclamation points.`,
};

function intensityNote(persona: PersonaId, intensity: number): string {
  if (persona !== 'savage') return '';
  if (intensity <= 1) return ` Dial: crude and mocking, but ease off the heaviest profanity — one or two jabs, not a barrage.`;
  if (intensity >= 3)
    return ` Dial: NO MERCY. Maximum profanity and contempt. Make it the meanest, most savage accountability text they've ever gotten — call them a bitch, a pussy, pathetic, whatever it takes — all aimed squarely at their excuses and the promise they're breaking to themselves. Still obey the hard limits above.`;
  return ` Dial: full brutal — swear, mock, and call them soft or a bitch for folding, aimed at the excuse.`;
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
        lines.push(`Situation: They just hit a NEW ALL-TIME PR on ${f.prName} (${f.prValue} ${unitsTxt(intent)}). Give them their due, then push them to keep the momentum.`);
      else lines.push(`Situation: They just reached a ${f.streak}-day training streak. Mark the milestone.`);
      break;
    case 'comeback':
      lines.push(`Situation: They just trained again after slacking off for a while. Acknowledge the return and make damn sure they don't vanish again.`);
      break;
    case 'streak_risk':
    case 'manual_test':
      lines.push(`Situation: They're on a ${f.streak}-day streak but STILL haven't trained today, and it's getting late. They're about to flush the streak tonight out of laziness.`);
      break;
    case 'missed_day':
      lines.push(`Situation: They haven't trained in ${f.daysSince} days — well past their usual cadence. They're slipping and making excuses.`);
      break;
    case 'checkin':
      lines.push(`Situation: A check-in. Get them moving toward their next session.`);
      break;
  }
  lines.push(`Their goal: ${f.goal || 'not specified'}`);
  lines.push(`The reason they gave you (their own words): ${f.why || 'not specified'}`);
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
        case 'savage': return `New PR on ${pr}. See what happens when you stop being soft and actually show up? Don't get comfortable. Do it again.`;
        case 'hype': return `🚨 NEW PR!! ${pr}! You are BUILT different today. Keep this fire going! 🔥`;
        case 'zen': return `A new best: ${pr}. Quietly earned. Continue.`;
        case 'analyst': return `New all-time e1RM: ${pr}. Trend positive. Maintain frequency to compound it.`;
        default: return `That's a new PR — ${pr}. Real proof you're getting${goal ? ` closer to ${goal}` : ' stronger'}. Proud of you. Keep going.`;
      }
    }
    switch (persona) {
      case 'savage': return `${streak} days straight. Don't you dare get cocky and fold now like you have before. Day ${streak + 1}. Go.`;
      case 'hype': return `${streak}-DAY STREAK!! 🔥 You're unstoppable right now. Make it ${streak + 1} today!`;
      case 'zen': return `${streak} days. The habit is becoming you. Keep it simple — train again.`;
      case 'analyst': return `Streak: ${streak} days. Statistically your strongest stretch. Train today to extend it.`;
      default: return `${streak} days in a row${goal ? ` toward ${goal}` : ''}. That's who you're becoming. Protect the streak today.`;
    }
  }

  if (intent.trigger === 'comeback') {
    switch (persona) {
      case 'savage': return `Look who crawled back. ${goal ? `${goal} ` : 'This '}isn't happening from the couch, so quit disappearing like a bitch and lock the fuck in. Next session is non-negotiable.`;
      case 'hype': return `YOU'RE BACK!! 🙌 That took guts. Now let's stack the next one — don't break the comeback!`;
      case 'zen': return `You returned. That's the whole skill. Begin again.`;
      case 'analyst': return `Session logged after a gap. Best predictor of the next session is training within 48h. Schedule it.`;
      default: return `Welcome back — showing up after a break is the hard part and you did it. Let's make the next session non-negotiable.`;
    }
  }

  if (intent.trigger === 'streak_risk' || intent.trigger === 'manual_test') {
    switch (persona) {
      case 'savage': return `${streak}-day streak and you're about to piss it away because you're "tired"? ${why ? `You literally said: "${quoteWhy(why)}." ` : ''}Stop being a little bitch and go train. One hour. NOW.`;
      case 'hype': return `${streak} days strong and the day's not over!! 💪 Don't let the streak die — go make it ${streak + 1}! LETS GO!`;
      case 'zen': return `${streak} days. Don't break the chain tonight. One set is enough to keep it alive.`;
      case 'analyst': return `Streak: ${streak} days, unbroken. No session logged today. Window closing. Train to preserve it.`;
      default: return `You've trained ${streak} days straight${goal ? ` toward ${goal}` : ''} — don't let tonight break it. Even 20 minutes keeps the streak alive.`;
    }
  }

  // missed_day
  switch (persona) {
    case 'savage': return `${days} days. Nothing. ${why ? `You told me "${quoteWhy(why)}" and then what — sat on your ass? ` : ''}That goal doesn't give a fuck about your excuses. Quit being a bitch and move${goalClause(intent)}. Today.`;
    case 'hype': return `${days} days off — TODAY's the comeback! 🔥 ${goal ? `That ${goal} goal is waiting. ` : ''}Lace up, I believe in you, LET'S GO!`;
    case 'zen': return `${days} days have passed. The bar is patient. When you're ready, begin — and today is a good day to be ready.`;
    case 'analyst': return `${days} days since last session vs ${f.daysPerWeek}x/week target. You're behind pace. One session today closes the gap.`;
    default: return `It's been ${days} days${goal ? ` — and ${goal} still matters to you` : ''}. No guilt, just go. Twenty minutes today restarts the momentum.`;
  }
}

// ---------- Generation (Grok / xAI + graceful fallback) ----------

const XAI_BASE = (process.env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
export const XAI_MODEL = process.env.XAI_MODEL || 'grok-4';

export function aiConfigured(): boolean {
  return !!process.env.XAI_API_KEY;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Low-level call to xAI's OpenAI-compatible chat endpoint. Returns raw text or null. */
export async function grokChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<string | null> {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: XAI_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 1.0,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[coach] xAI HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
      return null;
    }
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim() ? text : null;
  } catch (err) {
    console.error('[coach] xAI request failed:', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const MAX_LEN = 320;

function sanitize(raw: string): string {
  let t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('“') && t.endsWith('”'))) t = t.slice(1, -1).trim();
  t = t.replace(/^(coach|text|message|sms)\s*:\s*/i, '').trim();
  t = t.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
  if (t.length > MAX_LEN) {
    const cut = t.slice(0, MAX_LEN);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    t = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
  }
  return t;
}

/** A single system+user turn, sanitized for SMS. Returns null on any failure. */
async function callGrok(system: string, user: string): Promise<string | null> {
  const text = await grokChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: 1024, temperature: 1.1 },
  );
  return text ? sanitize(text) : null;
}

export async function generateNudgeBody(
  persona: PersonaId,
  intensity: number,
  intent: NudgeIntent,
): Promise<{ body: string; source: 'ai' | 'template' }> {
  if (aiConfigured()) {
    const text = await callGrok(buildSystemPrompt(persona, intensity), buildUserMessage(intent));
    if (text) return { body: text, source: 'ai' };
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
    const system =
      buildSystemPrompt(persona, intensity) +
      `\n\nThey just texted you back. Reply in one short message that keeps them accountable. If they claim they trained, give them their due briefly. If they make an excuse, tear into it in character. If they mention injury/illness or a real crisis, drop the act and tell them to rest.`;
    const user = `Their goal: ${context.goal || 'not specified'}. Their reason: ${context.why || 'not specified'}.\nThey texted: "${context.inbound}"\nReply now.`;
    const text = await callGrok(system, user);
    if (text) return text;
  }
  return `Save the excuses. Whatever today looks like, get one session in — you made yourself a promise.`;
}
