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

// Hoisted Intl formatters - per js-hoist-intl rule
// These are expensive to instantiate, so we create them once at module scope

// Date formatters
export const dateFormatters = {
  short: new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'short' }),
  medium: new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'medium' }),
  long: new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'long' }),
  time: new Intl.DateTimeFormat(i18n.locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
  timeShort: new Intl.DateTimeFormat(i18n.locale, {
    hour: 'numeric',
    minute: '2-digit',
  }),
  dayMonth: new Intl.DateTimeFormat(i18n.locale, {
    day: 'numeric',
    month: 'short',
  }),
  weekday: new Intl.DateTimeFormat(i18n.locale, { weekday: 'long' }),
  weekdayShort: new Intl.DateTimeFormat(i18n.locale, { weekday: 'short' }),
};

// Number formatters
export const numberFormatters = {
  decimal: new Intl.NumberFormat(i18n.locale),
  ml: new Intl.NumberFormat(i18n.locale, {
    style: 'unit',
    unit: 'milliliter',
    unitDisplay: 'short',
  }),
};

// Helper function to update formatters when locale changes
export const updateLocale = (locale: SupportedLocale) => {
  i18n.locale = locale;

  // Recreate formatters with new locale
  dateFormatters.short = new Intl.DateTimeFormat(locale, { dateStyle: 'short' });
  dateFormatters.medium = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  dateFormatters.long = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
  dateFormatters.time = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  dateFormatters.timeShort = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  dateFormatters.dayMonth = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  });
  dateFormatters.weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  dateFormatters.weekdayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  numberFormatters.decimal = new Intl.NumberFormat(locale);
  numberFormatters.ml = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'milliliter',
    unitDisplay: 'short',
  });
};

export { i18n };
export type { SupportedLocale };
