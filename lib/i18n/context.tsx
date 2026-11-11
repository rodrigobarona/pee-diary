import * as React from 'react';
import { AppState } from 'react-native';

import {
  i18n,
  refreshDeviceFormat,
  updateLocale,
  type SupportedLocale,
} from './index';
import { useDiaryStore } from '@/lib/store';

interface I18nContextValue {
  locale: SupportedLocale;
  t: (key: string, options?: Record<string, unknown>) => string;
  setLocale: (locale: SupportedLocale) => void;
  /**
   * Changes when the device's clock, first weekday or region may have
   * changed (the app came back to the foreground), so dates re-render.
   */
  formatVersion: number;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // The stored language is the source of truth
  const locale = useDiaryStore((state) => state.language);
  const setStoreLanguage = useDiaryStore((state) => state.setLanguage);

  // Keep the module-level translations and formatters in step before the
  // children render with the new language
  if (i18n.locale !== locale) {
    updateLocale(locale);
  }

  // The user can switch between 12- and 24-hour time, or change region,
  // while the app is in the background
  const [formatVersion, setFormatVersion] = React.useState(0);
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDeviceFormat();
        setFormatVersion((version) => version + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  const setLocale = React.useCallback(
    (newLocale: SupportedLocale) => {
      updateLocale(newLocale);
      setStoreLanguage(newLocale);
    },
    [setStoreLanguage]
  );

  // Translate in the current language; a new function per language so
  // memoised children re-render
  const t = React.useCallback(
    (key: string, options?: Record<string, unknown>) =>
      i18n.t(key, { locale, ...options }),
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, t, setLocale, formatVersion }),
    [locale, t, setLocale, formatVersion]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Re-export for convenience
export type { SupportedLocale };
