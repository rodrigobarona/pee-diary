import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// Initialize i18n
const i18n = new I18n({
  en,
  es,
  pt,
});

// Set the locale once at the beginning of your app
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';

// Map device locale to supported locale
const supportedLocales = ['en', 'es', 'pt'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const getInitialLocale = (): SupportedLocale => {
  if (supportedLocales.includes(deviceLocale as SupportedLocale)) {
    return deviceLocale as SupportedLocale;
  }
  // Handle pt-BR -> pt
  if (deviceLocale.startsWith('pt')) {
    return 'pt';
  }
  return 'en';
};

i18n.locale = getInitialLocale();

// Enable fallback to English
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

/**
 * Locale used for dates, times and numbers. Portuguese and Spanish use the
 * European conventions (pt-PT, es-ES), as in the Eleva monorepo; bare "pt"
 * would format dates the Brazilian way.
 */
export const intlLocales: Record<SupportedLocale, string> = {
  en: 'en',
  es: 'es-ES',
  pt: 'pt-PT',
};

export const intlLocale = (locale: string): string =>
  intlLocales[locale as SupportedLocale] ?? locale;

// Hoisted Intl formatters - per js-hoist-intl rule
// These are expensive to instantiate, so we create them once per locale
const buildDateFormatters = (locale: SupportedLocale) => {
  const l = intlLocale(locale);
  return {
    short: new Intl.DateTimeFormat(l, { dateStyle: 'short' }),
    medium: new Intl.DateTimeFormat(l, { dateStyle: 'medium' }),
    long: new Intl.DateTimeFormat(l, { dateStyle: 'long' }),
    // 12-hour clock in English, 24-hour in Spanish and Portuguese
    time: new Intl.DateTimeFormat(l, {
      hour: locale === 'en' ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: locale === 'en',
    }),
    timeShort: new Intl.DateTimeFormat(l, {
      hour: locale === 'en' ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: locale === 'en',
    }),
    dayMonth: new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short' }),
    dayMonthYear: new Intl.DateTimeFormat(l, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    weekdayDayMonth: new Intl.DateTimeFormat(l, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    monthYear: new Intl.DateTimeFormat(l, { month: 'long', year: 'numeric' }),
    monthShort: new Intl.DateTimeFormat(l, { month: 'short' }),
    weekday: new Intl.DateTimeFormat(l, { weekday: 'long' }),
    weekdayShort: new Intl.DateTimeFormat(l, { weekday: 'short' }),
    weekdayNarrow: new Intl.DateTimeFormat(l, { weekday: 'narrow' }),
  };
};

const buildNumberFormatters = (locale: SupportedLocale) => {
  const l = intlLocale(locale);
  return {
    decimal: new Intl.NumberFormat(l),
    ml: new Intl.NumberFormat(l, {
      style: 'unit',
      unit: 'milliliter',
      unitDisplay: 'short',
    }),
  };
};

export const dateFormatters = buildDateFormatters(i18n.locale as SupportedLocale);
export const numberFormatters = buildNumberFormatters(i18n.locale as SupportedLocale);

/** Monday-first single-letter weekday labels in the current locale. */
export const getWeekdayLabels = (): string[] => {
  // 2 January 2023 was a Monday
  return Array.from({ length: 7 }, (_, i) =>
    dateFormatters.weekdayNarrow.format(new Date(2023, 0, 2 + i))
  );
};

/**
 * Monday-first three-letter weekday names in the current locale
 * (pt-PT "seg, ter…", es-ES "lun, mar…", en "Mon, Tue…").
 */
export const getWeekdayShortLabels = (): string[] => {
  return Array.from({ length: 7 }, (_, i) =>
    dateFormatters.weekdayShort
      .format(new Date(2023, 0, 2 + i))
      .replace('.', '')
      .slice(0, 3)
  );
};

// Helper function to update formatters when locale changes
export const updateLocale = (locale: SupportedLocale) => {
  i18n.locale = locale;
  Object.assign(dateFormatters, buildDateFormatters(locale));
  Object.assign(numberFormatters, buildNumberFormatters(locale));
};

export { i18n };
export type { SupportedLocale };
