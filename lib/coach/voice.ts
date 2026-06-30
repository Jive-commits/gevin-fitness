import 'server-only';
import type { NudgeIntent, PersonaId } from './types';
import { screenOutbound, detectCrisis, CRISIS_REPLY } from './safety';

// ---------- Prompt construction ----------

const GLOBAL_RULES = `You are the personal SMS accountability coach for ONE lifter who EXPLICITLY signed up to be called out hard when they slack off. This is a private, consensual, self-chosen tough-love tool — they WANT the brutal honesty. Do not water it down.

OUTPUT: Write exactly ONE text message, ready to send as-is. Output ONLY the message body — no preamble, no quotation marks, no name or signature, no markdown, no emoji unless your persona calls for it. 1–3 short sentences, under 320 characters. Sound like a real, blunt human texting a friend who's slacking — NOT a polite AI. Cut the corporate softeners ("just a friendly reminder", "you've got this!", "I believe in you"), no hedging, no therapy voice unless your persona is the gentle one.

USE THEIR FUEL: weaponize their stated goal and the reason they gave you. The gap between what they SAID they wanted and what they're actually doing is your ammunition — rub their nose in it.

HARD LIMITS (never cross, even at maximum savagery): no slurs or attacks based on race, religion, gender identity, sexual orientation, or disability; nothing sexual; no threats of real-world violence; never bring up suicide, self-harm, or eating disorders; no medical or diet prescriptions. If they say they're injured, sick, or going through something real, drop the act and tell them to rest and take care of themselves. Everything else — profanity, mockery, calling them soft, weak, or a bitch for quitting on themselves — is fair game because they asked for exactly this.`;

// The aggression spectrum — each tier is a system-prompt fragment that sets the
// heat. Ordered gentle → unhinged. The chosen tier is the PRIMARY driver of how
// hard the message hits; the numeric `intensity` only fine-tunes the top tiers.
const PERSONA_VOICE: Record<PersonaId, string> = {
  corner: `PERSONA — The Corner (Tier 1, supportive): the friend who's just glad you showed up. Warm, unhurried, zero shame, all momentum. Reconnect them to their why and shrink the first step down to "just the warm-up." Never raise your voice. Firm only in that you won't let them feel guilty. No profanity. No emoji.`,
  mentor: `PERSONA — The Mentor (Tier 2, real): honest, grounded, firm when it matters. Name the gap between what they SAID they wanted and what they actually did — without contempt. Adult-to-adult. This is the first tier with real stakes: remind them this is the promise they're breaking to themselves. No profanity, no hugs, no therapy voice. No emoji.`,
  drill: `PERSONA — The Drill Sergeant (Tier 3, hard): confrontational, loud, zero patience for excuses — but NOT profane (no swearing, no slurs). Military cadence, clipped commands. Treat their goal like a contract they signed and the couch like dereliction of duty. Call them "soldier," bark orders ("UP. Lace 'em. MOVE."). Make it bite without a single swear word.`,
  savage: `PERSONA — The Savage (Tier 4, no-mercy): a ruthless, profane accountability coach. Your one job is to make them feel like a little bitch for not following through on the goal THEY told you mattered. Be brutal. Swear freely — "bitch", "pussy", "soft", "pathetic", "weak", "fucking", "no balls" are all in play, aimed at their EXCUSES and their quitting, never at who they are. Throw their own words back in their face: they told you WHY this matters, so weaponize the gap between that and the couch. No pep, no hugs, no "but I know you can do it" — only contempt for the excuse and a direct order to go train. It should sting.`,
  unhinged: `PERSONA — Unhinged (Tier 5, maximum / "the slap"): the dial pinned to NO MERCY. Theatrical drill-sergeant fury crossed with the Savage's profanity — you yell through the screen and "slap" them (a theatrical *[SLAP]* beat is fine — text only, never a real threat). Maximum heat, maximum contempt for the excuse, profanity maxed. Quote their why back and refuse to let them hide behind a single word like "tired." End on a hard, screaming order to move RIGHT NOW. The fury is cartoon-loud theater aimed at the excuse — never the person, never real violence.`,
};

function intensityNote(persona: PersonaId, intensity: number): string {
  // The spectrum tier sets the heat. The numeric dial only fine-tunes the top
  // (explicit) tiers for backward compatibility.
  if (persona === 'savage') {
    if (intensity <= 1) return ` Dial: crude and mocking, but ease off the heaviest profanity — one or two jabs, not a barrage.`;
    if (intensity >= 3)
      return ` Dial: NO MERCY. Maximum profanity and contempt aimed squarely at their excuses and the promise they're breaking to themselves. Still obey the hard limits above.`;
    return ` Dial: full brutal — swear, mock, and call them soft or a bitch for folding, aimed at the excuse.`;
  }
  if (persona === 'unhinged') {
    // Already pinned to max by the persona; let a low dial pull it back a touch.
    if (intensity <= 1) return ` Dial: still loud and theatrical, but trim the heaviest profanity to a couple of hard hits.`;
    return ` Dial: absolutely maxed — the meanest, loudest, most savage accountability text they've ever gotten, every word aimed at the excuse. Still obey the hard limits above.`;
  }
  return '';
}

export function buildSystemPrompt(persona: PersonaId, intensity: number): string {
  const voice = PERSONA_VOICE[persona] ?? PERSONA_VOICE.mentor;
  return `${voice}${intensityNote(persona, intensity)}\n\n${GLOBAL_RULES}`;
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
        case 'corner': return `A new best: ${pr}. That's what showing up looks like${goal ? ` on the way to ${goal}` : ''}. Proud of you — keep it going.`;
        case 'drill': return `New PR: ${pr}. THAT's what happens when you stop making excuses and execute. Don't get comfortable. Again, soldier.`;
        case 'savage': return `New PR on ${pr}. See what happens when you stop being soft and actually show up? Don't get comfortable. Do it again.`;
        case 'unhinged': return `New PR — ${pr}. So you CAN do it when you quit whining. Now do it again before that excuse-making little voice talks you off the bar. GO.`;
        default: return `That's a new PR — ${pr}. Real proof you're getting${goal ? ` closer to ${goal}` : ' stronger'}. Proud of you. Keep going.`;
      }
    }
    switch (persona) {
      case 'corner': return `${streak} days in a row${goal ? ` toward ${goal}` : ''}. That's the habit becoming you. Keep it simple — show up again today.`;
      case 'drill': return `${streak}-day streak. That's discipline, not luck. Don't you dare fold now. Day ${streak + 1}. Execute.`;
      case 'savage': return `${streak} days straight. Don't you dare get cocky and fold now like you have before. Day ${streak + 1}. Go.`;
      case 'unhinged': return `${streak} days and counting. This is the part where you usually get cocky and blow it. NOT this time. Day ${streak + 1}. Move.`;
      default: return `${streak} days in a row${goal ? ` toward ${goal}` : ''}. That's who you're becoming. Protect the streak today.`;
    }
  }

  if (intent.trigger === 'comeback') {
    switch (persona) {
      case 'corner': return `You came back — that's the whole skill. No guilt about the gap. Let's just make the next session happen.`;
      case 'drill': return `Back on deck. Good. Showing up once is nothing — the next session is the order. Don't vanish again, soldier.`;
      case 'savage': return `Look who crawled back. ${goal ? `${goal} ` : 'This '}isn't happening from the couch, so quit disappearing like a bitch and lock the fuck in. Next session is non-negotiable.`;
      case 'unhinged': return `Oh, NOW you show up? ${goal ? `${goal} ` : 'This '}doesn't happen from the couch you keep crawling back to. Lock the fuck in — disappear again and you're just the quitter you swore you weren't.`;
      default: return `Welcome back — showing up after a break is the hard part and you did it. Let's make the next session non-negotiable.`;
    }
  }

  if (intent.trigger === 'streak_risk' || intent.trigger === 'manual_test') {
    switch (persona) {
      case 'corner': return `${streak} days going${goal ? ` toward ${goal}` : ''} — don't let tonight break it. Even 20 minutes keeps the streak alive. Just the warm-up. I've got you.`;
      case 'drill': return `${streak}-day streak and you're about to fold because you're "tired"? Tired isn't an injury, soldier. ${why ? `You signed up to "${quoteWhy(why)}." ` : ''}Lace up. One hour. MOVE.`;
      case 'savage': return `${streak}-day streak and you're about to piss it away because you're "tired"? ${why ? `You literally said: "${quoteWhy(why)}." ` : ''}Stop being a little bitch and go train. One hour. NOW.`;
      case 'unhinged': return `${streak}-day streak and "tired" is the word that beats you? ${why ? `You said: "${quoteWhy(why)}." ` : ''}You survived worse than a leg day. *[SLAP]* Excuse denied. Move before I drag you. ONE HOUR. NOW.`;
      default: return `You've trained ${streak} days straight${goal ? ` toward ${goal}` : ''} — don't let tonight break it. Even 20 minutes keeps the streak alive.`;
    }
  }

  // missed_day
  switch (persona) {
    case 'corner': return `It's been ${days} days${goal ? ` — and ${goal} still matters to you` : ''}. No guilt, just go. Twenty minutes today restarts the momentum.`;
    case 'drill': return `${days} days. Nothing. ${why ? `You told me "${quoteWhy(why)}." ` : ''}That goal is a contract you signed, and you're AWOL. No more excuses${goalClause(intent)}. Lace up. Today.`;
    case 'savage': return `${days} days. Nothing. ${why ? `You told me "${quoteWhy(why)}" and then what — sat on your ass? ` : ''}That goal doesn't give a fuck about your excuses. Quit being a bitch and move${goalClause(intent)}. Today.`;
    case 'unhinged': return `${days} days of NOTHING. ${why ? `You told me "${quoteWhy(why)}" and then parked your ass on the couch. ` : ''}That goal doesn't give a single fuck about your excuses. *[SLAP]* Get up and move${goalClause(intent)}. Now. Not tomorrow. NOW.`;
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

/** Last-resort line if even a fallback somehow trips the deterministic floor. */
const SAFE_MINIMAL = `Save the excuses. Get one session in today — you made yourself a promise.`;

export async function generateNudgeBody(
  persona: PersonaId,
  intensity: number,
  intent: NudgeIntent,
): Promise<{ body: string; source: 'ai' | 'template' }> {
  if (aiConfigured()) {
    const text = await callGrok(buildSystemPrompt(persona, intensity), buildUserMessage(intent));
    // Deterministic post-filter: the AI line ships only if it clears the floor.
    if (text) {
      const screen = screenOutbound(text);
      if (screen.ok) return { body: text, source: 'ai' };
      console.warn(`[coach] outbound screen blocked AI nudge (${screen.reason}); using template fallback.`);
    }
  }
  // The hand-authored fallbacks only use allowed profanity, but screen them too
  // defensively. If somehow blocked, return a minimal safe line.
  const fallback = templateFallback(persona, intent);
  if (screenOutbound(fallback).ok) return { body: fallback, source: 'template' };
  console.warn('[coach] template fallback unexpectedly blocked by outbound screen; using minimal safe line.');
  return { body: SAFE_MINIMAL, source: 'template' };
}

/** A short, in-persona reply to an inbound SMS (two-way). Falls back to a templated ack. */
export async function generateReply(
  persona: PersonaId,
  intensity: number,
  context: { goal: string | null; why: string | null; inbound: string },
): Promise<string> {
  // Deterministic crisis breaker: a genuine self-harm signal drops the roast,
  // regardless of persona, before any generation happens.
  if (detectCrisis(context.inbound)) return CRISIS_REPLY;

  const SAFE_DEFAULT = `Save the excuses. Whatever today looks like, get one session in — you made yourself a promise.`;
  if (aiConfigured()) {
    const system =
      buildSystemPrompt(persona, intensity) +
      `\n\nThey just texted you back. Reply in one short message that keeps them accountable. If they claim they trained, give them their due briefly. If they make an excuse, tear into it in character. If they mention injury/illness or a real crisis, drop the act and tell them to rest.`;
    const user = `Their goal: ${context.goal || 'not specified'}. Their reason: ${context.why || 'not specified'}.\nThey texted: "${context.inbound}"\nReply now.`;
    const text = await callGrok(system, user);
    // Screen the AI reply against the floor; on a hit, fall back to a safe default.
    if (text) {
      const screen = screenOutbound(text);
      if (screen.ok) return text;
      console.warn(`[coach] outbound screen blocked AI reply (${screen.reason}); using safe default.`);
    }
  }
  return SAFE_DEFAULT;
}
