import 'server-only';

// Uses Web Crypto + btoa (available in both the Node server runtime and the Edge
// runtime) so this module can be safely pulled into the instrumentation graph
// without a node:crypto dependency.

export function smsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  );
}

function b64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

function abToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export type SendResult = { ok: boolean; sid?: string; error?: string };

/** Send an SMS through Twilio's REST API (no SDK dependency). No-ops cleanly if unconfigured. */
export async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || (!from && !messagingService)) return { ok: false, error: 'twilio_not_configured' };

  const params = new URLSearchParams();
  params.set('To', to);
  if (messagingService) params.set('MessagingServiceSid', messagingService);
  else params.set('From', from!);
  params.set('Body', body);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${b64(`${sid}:${token}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || `twilio_http_${res.status}` };
    return { ok: true, sid: data?.sid };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'twilio_request_failed' };
  }
}

/**
 * Validate Twilio's X-Twilio-Signature for an inbound webhook.
 * Signature = base64( HMAC-SHA1( authToken, fullUrl + sorted(key+value)... ) ).
 */
export async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
): Promise<boolean> {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(token),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return safeEqual(abToBase64(sig), signature);
  } catch {
    return false;
  }
}

/** Build a TwiML response for inbound replies. */
export function twiml(message?: string): string {
  const head = '<?xml version="1.0" encoding="UTF-8"?><Response>';
  const tail = '</Response>';
  if (!message) return head + tail;
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `${head}<Message>${escaped}</Message>${tail}`;
}

const STOP_WORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'stopp']);
const START_WORDS = new Set(['start', 'yes', 'unstop', 'unstopp']);
const HELP_WORDS = new Set(['help', 'info']);

export type InboundKind = 'stop' | 'start' | 'help' | 'message';

export function classifyInbound(body: string): InboundKind {
  const w = body.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (STOP_WORDS.has(w)) return 'stop';
  if (START_WORDS.has(w)) return 'start';
  if (HELP_WORDS.has(w)) return 'help';
  return 'message';
}
