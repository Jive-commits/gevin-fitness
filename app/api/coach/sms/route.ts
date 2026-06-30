import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCoachProfile, personaOf, goalPhrase } from '@/lib/coach/profile';
import { validateTwilioSignature, twiml, classifyInbound } from '@/lib/coach/sms';
import { generateReply } from '@/lib/coach/voice';

export const dynamic = 'force-dynamic';

function xml(body: string) {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

// Twilio signs the exact public URL it POSTed to. Honor proxy forwarding (Railway).
function publicUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export async function POST(req: NextRequest) {
  let params: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = typeof v === 'string' ? v : '';
  } catch {
    return new NextResponse('bad request', { status: 400 });
  }

  // Reject anything not actually signed by Twilio.
  const signature = req.headers.get('x-twilio-signature');
  if (!(await validateTwilioSignature(publicUrl(req), params, signature))) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const body = (params['Body'] || '').trim();
  const profile = await getCoachProfile();
  const kind = classifyInbound(body);

  await prisma.nudgeLog.create({
    data: { profileId: profile.id, direction: 'inbound', channel: 'sms', trigger: 'reply', body, status: 'received' },
  });

  if (kind === 'stop') {
    await prisma.coachProfile.update({ where: { id: profile.id }, data: { smsStopped: true, smsConsent: false } });
    return xml(twiml("You're unsubscribed from FORGE coach texts. Reply START to resume anytime."));
  }
  if (kind === 'start') {
    await prisma.coachProfile.update({
      where: { id: profile.id },
      data: { smsStopped: false, smsConsent: true, smsConsentAt: new Date() },
    });
    return xml(twiml("You're back in. I'll keep you honest. Reply STOP anytime to opt out."));
  }
  if (kind === 'help') {
    return xml(twiml('FORGE coach sends accountability texts for your training. Msg & data rates may apply. Reply STOP to opt out.'));
  }

  // Two-way conversation: reply in persona.
  const persona = personaOf(profile);
  const reply = await generateReply(persona, profile.intensity, {
    goal: goalPhrase(profile),
    why: profile.why,
    inbound: body,
  });
  await prisma.nudgeLog.create({
    data: { profileId: profile.id, direction: 'outbound', channel: 'sms', trigger: 'reply', persona, body: reply, status: 'sent' },
  });
  return xml(twiml(reply));
}
