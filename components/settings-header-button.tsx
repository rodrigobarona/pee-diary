import { useRouter } from 'expo-router';
import * as React from 'react';

import { HeaderIconButton } from '@/components/ui/header-button';
import { useI18n } from '@/lib/i18n/context';

/**
 * The gear in the Today and History headers. Its accessible name is
 * "Settings" (as the privacy documents tell people to "tap Settings").
 */
export function SettingsHeaderButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <HeaderIconButton
      icon="cog-outline"
      label={t('tabs.settings')}
      onPress={() => router.push('/settings')}
      testID="settings-button"
    />
  );
}
