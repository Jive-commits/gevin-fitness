import { PageHeader } from '@/components/page-header';
import { SettingsView } from '@/components/settings/settings-view';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Settings" eyebrow="Your instrument" />
      <SettingsView settings={settings} />
    </>
  );
}
