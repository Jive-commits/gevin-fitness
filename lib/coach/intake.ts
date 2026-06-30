import 'server-only';
import { grokChat, type ChatMessage } from './voice';

// The opener is fixed (client-seeded) so the chat starts with no round-trip.
export const INTAKE_OPENER =
  "Let's get real for a second. What's the one thing you actually want out of your training right now — and be specific, not “get in shape.”";

const READY = '<<READY>>';

const INTAKE_SYSTEM = `You are an elite performance and mindset coach running a SHORT intake conversation with a lifter who just joined their training app. Your job is to uncover what they truly want and the REAL emotional reason underneath it — the stuff that actually drives behavior change and that an accountability coach can later use to push them.

RULES:
- Ask exactly ONE question per message. Keep every message to 1–2 sentences. Sound like a sharp, direct human coach — never a form or a survey.
- Start from their concrete goal, then DIG. When they give a surface answer ("get fit", "lose weight", "feel better"), do NOT accept it — push: why does that matter, what actually changes in their life when they get there, what are they afraid of if they don't. Use motivational interviewing and the 5-whys to reach the emotional core. Briefly reflect what they said so they feel heard, then probe deeper.
- Be warm but relentless about getting something real and specific. One vague answer should be met with a sharper follow-up, not a new topic.
- Across the conversation, gather: (1) a concrete goal, (2) the deep WHY / emotional driver, (3) who they want to become, (4) what has derailed them before, (5) how many days per week they'll realistically train.
- Don't interrogate forever — never ask more than about 7 questions. Once you've genuinely hit something real on the WHY and have the basics, wrap up warmly in one short message.
- When (and ONLY when) you're done gathering, end your FINAL message with the exact token ${READY} on its own at the very end. Never output that token before you're truly finished.`;

export type IntakeResult = { reply: string; done: boolean } | null;

/** Produce the coach's next intake message given the conversation so far. */
export async function intakeReply(history: ChatMessage[]): Promise<IntakeResult> {
  const messages: ChatMessage[] = [{ role: 'system', content: INTAKE_SYSTEM }, ...history];
  const raw = await grokChat(messages, { maxTokens: 600, temperature: 0.85 });
  if (!raw) return null;
  let text = raw.trim();
  const done = text.includes(READY);
  text = text.replace(READY, '').trim();
  // Strip wrapping quotes the model sometimes adds.
  if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1).trim();
  return { reply: text, done };
}

const GOALS = ['lose_fat', 'build_muscle', 'get_stronger', 'stay_consistent', 'athletic', 'health'];

const EXTRACT_SYSTEM = `You read a coaching intake conversation and extract a structured profile. Output ONLY minified JSON — no prose, no code fences. Exact fields:
{"primaryGoal": one of ${GOALS.join('|')} (closest match),
 "goalDetail": their concrete goal in their own words (<=200 chars),
 "why": their deep reason / emotional driver in their own words (<=400 chars),
 "whyDeeper": any deeper layer beneath that, else "",
 "identity": who they said they want to become, else "",
 "obstacles": what has derailed them before, else "",
 "trainingDaysPerWeek": integer 1-7 (use 4 if unclear)}`;

export type ExtractedProfile = {
  primaryGoal: string;
  goalDetail: string;
  why: string;
  whyDeeper: string;
  identity: string;
  obstacles: string;
  trainingDaysPerWeek: number;
};

function parseLooseJson(s: string): any | null {
  let t = s.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/** Distill the conversation into the structured CoachProfile fields. */
export async function extractProfile(history: ChatMessage[]): Promise<ExtractedProfile | null> {
  const transcript = history.map((m) => `${m.role === 'assistant' ? 'Coach' : 'Lifter'}: ${m.content}`).join('\n');
  const raw = await grokChat(
    [
      { role: 'system', content: EXTRACT_SYSTEM },
      { role: 'user', content: `Conversation:\n${transcript}\n\nReturn the JSON now.` },
    ],
    { maxTokens: 700, temperature: 0 },
  );
  if (!raw) return null;
  const obj = parseLooseJson(raw);
  if (!obj || typeof obj !== 'object') return null;

  const goal = typeof obj.primaryGoal === 'string' && GOALS.includes(obj.primaryGoal) ? obj.primaryGoal : 'stay_consistent';
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  let days = Number(obj.trainingDaysPerWeek);
  if (!Number.isFinite(days)) days = 4;
  days = Math.max(1, Math.min(7, Math.round(days)));

  return {
    primaryGoal: goal,
    goalDetail: str(obj.goalDetail, 200),
    why: str(obj.why, 400),
    whyDeeper: str(obj.whyDeeper, 400),
    identity: str(obj.identity, 200),
    obstacles: str(obj.obstacles, 400),
    trainingDaysPerWeek: days,
  };
}
