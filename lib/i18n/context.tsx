import * as React from 'react';
import { i18n, updateLocale, type SupportedLocale } from './index';
import { useDiaryStore } from '@/lib/store';

interface I18nContextValue {
  locale: SupportedLocale;
  t: typeof i18n.t;
  setLocale: (locale: SupportedLocale) => void;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const storeLanguage = useDiaryStore((state) => state.language);
  const setStoreLanguage = useDiaryStore((state) => state.setLanguage);
  
  // Local state to trigger re-renders - initialize with store language
  const [locale, setLocaleState] = React.useState<SupportedLocale>(storeLanguage);

  // Sync i18n with store language on mount and when store changes
  React.useEffect(() => {
    // Always update i18n when store language changes
    if (storeLanguage !== i18n.locale) {
      updateLocale(storeLanguage);
    }
    
    // Update local state to trigger re-renders
    if (storeLanguage !== locale) {
      setLocaleState(storeLanguage);
    }
  }, [storeLanguage, locale]);

  const setLocale = React.useCallback(
    (newLocale: SupportedLocale) => {
      setStoreLanguage(newLocale);
      updateLocale(newLocale);
      setLocaleState(newLocale);
    },
    [setStoreLanguage]
  );

  // Bind t function to current instance
  const t = React.useCallback(
    (key: string, options?: Record<string, unknown>) => {
      return i18n.t(key, options);
    },
    [locale] // Re-create when locale changes to ensure fresh translations
  );

  const value = React.useMemo(
    () => ({
      locale,
      t,
      setLocale,
    }),
    [locale, t, setLocale]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
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
