import { PageHeader } from '@/components/page-header';
import { SettingsView } from '@/components/settings/settings-view';
import { CoachSettings, type CoachProfileDTO, type CoachEnv } from '@/components/settings/coach-settings';
import { getSettings } from '@/lib/settings';
import { getCoachProfile, isOnboarded } from '@/lib/coach/profile';
import { aiConfigured } from '@/lib/coach/voice';
import { smsConfigured } from '@/lib/coach/sms';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings, profile] = await Promise.all([getSettings(), getCoachProfile()]);

  const dto: CoachProfileDTO = {
    onboarded: isOnboarded(profile),
    primaryGoal: profile.primaryGoal,
    goalDetail: profile.goalDetail,
    why: profile.why,
    whyDeeper: profile.whyDeeper,
    identity: profile.identity,
    obstacles: profile.obstacles,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    enabled: profile.enabled,
    persona: profile.persona,
    intensity: profile.intensity,
    channel: profile.channel,
    phoneNumber: profile.phoneNumber,
    smsConsent: profile.smsConsent,
    smsStopped: profile.smsStopped,
    timezone: profile.timezone,
    quietStartHour: profile.quietStartHour,
    quietEndHour: profile.quietEndHour,
  };
  const env: CoachEnv = { ai: aiConfigured(), sms: smsConfigured() };

  return (
    <>
      <PageHeader title="Settings" eyebrow="Your instrument" />
      <div className="px-4 pt-3">
        <CoachSettings profile={dto} env={env} />
      </div>
      <SettingsView settings={settings} />
    </>
  );
}
