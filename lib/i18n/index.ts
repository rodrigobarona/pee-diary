import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import {
  hourFormatOptions,
  readDeviceFormat,
  resolveIntlLocale,
  timeFormatOptions,
  type DeviceFormat,
  type WeekStartsOn,
} from './device-format';

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
 * Device date and time conventions (24-hour clock, first day of the week,
 * region), read at start-up and again by refreshDeviceFormat().
 */
const deviceFormat: DeviceFormat = readDeviceFormat();

/**
 * Locale used for dates, times and numbers. Portuguese and Spanish use the
 * European conventions (pt-PT, es-ES), as in the Eleva monorepo; bare "pt"
 * would format dates the Brazilian way. English follows the device region.
 */
export const intlLocale = (locale: string): string =>
  resolveIntlLocale(locale, deviceFormat.regionCode);

/** Intl options for hours and minutes in the device's 12/24-hour clock. */
export const deviceTimeFormatOptions = (): Intl.DateTimeFormatOptions =>
  timeFormatOptions(deviceFormat.uses24hourClock);

/** First day of the week (date-fns index, 0 = Sunday) from the device. */
export const getWeekStartsOn = (): WeekStartsOn => deviceFormat.weekStartsOn;

/** Whether the device uses a 24-hour clock (null when it does not say). */
export const deviceUses24hourClock = (): boolean | null =>
  deviceFormat.uses24hourClock;

// Hoisted Intl formatters - per js-hoist-intl rule
// These are expensive to instantiate, so we create them once per locale
const buildDateFormatters = (locale: SupportedLocale) => {
  const l = intlLocale(locale);
  return {
    short: new Intl.DateTimeFormat(l, { dateStyle: 'short' }),
    medium: new Intl.DateTimeFormat(l, { dateStyle: 'medium' }),
    long: new Intl.DateTimeFormat(l, { dateStyle: 'long' }),
    // The device's 12- or 24-hour clock, in every language
    time: new Intl.DateTimeFormat(l, timeFormatOptions(deviceFormat.uses24hourClock)),
    hour: new Intl.DateTimeFormat(l, hourFormatOptions(deviceFormat.uses24hourClock)),
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
    weekdayAxis: weekdayAxisFormatter(locale, l),
  };
};

/**
 * Weekday labels under chart bars. One letter in English and Spanish; in
 * Portuguese one letter is ambiguous (S is Monday, Friday and Saturday), so
 * three: "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom".
 */
function weekdayAxisFormatter(locale: SupportedLocale, l: string) {
  if (locale !== 'pt') {
    return new Intl.DateTimeFormat(l, { weekday: 'narrow' });
  }
  const short = new Intl.DateTimeFormat(l, { weekday: 'short' });
  return {
    format: (date: Date) => {
      const label = short.format(date).replace(/\.$/, '');
      return label.charAt(0).toUpperCase() + label.slice(1, 3);
    },
  };
}

const buildNumberFormatters = (locale: SupportedLocale) => {
  const l = intlLocale(locale);
  // Portuguese and Spanish write 1504, not 1 504 or 1.504: group only from
  // five digits (iOS does this already; Android's Intl groups four)
  const grouped = new Intl.NumberFormat(l);
  const ungrouped = new Intl.NumberFormat(l, { useGrouping: false });
  const decimal =
    locale === 'en'
      ? grouped
      : {
          format: (value: number) =>
            (Math.abs(value) < 10000 ? ungrouped : grouped).format(value),
        };
  return {
    decimal,
    ml: new Intl.NumberFormat(l, {
      style: 'unit',
      unit: 'milliliter',
      unitDisplay: 'short',
    }),
  };
};

export const dateFormatters = buildDateFormatters(i18n.locale as SupportedLocale);
export const numberFormatters = buildNumberFormatters(i18n.locale as SupportedLocale);

// 1 January 2023 was a Sunday: day i of the week starting on `weekStartsOn`
const weekdayDate = (i: number) =>
  new Date(2023, 0, 1 + ((deviceFormat.weekStartsOn + i) % 7));

/**
 * Single-letter weekday labels in the current locale, starting on the
 * device's first day of the week.
 */
export const getWeekdayLabels = (): string[] =>
  Array.from({ length: 7 }, (_, i) =>
    dateFormatters.weekdayNarrow.format(weekdayDate(i))
  );

/**
 * Full weekday names in the current locale, starting on the device's first
 * day of the week (for accessibility labels).
 */
export const getWeekdayLongLabels = (): string[] =>
  Array.from({ length: 7 }, (_, i) =>
    dateFormatters.weekday.format(weekdayDate(i))
  );

/**
 * A range of whole hours in the device's clock, for the time-of-day groups
 * ("00:00–05:00" or "12 AM–5 AM"). 24 is midnight at the end of the day.
 */
export const formatHourRange = (startHour: number, endHour: number): string => {
  const at = (hour: number) => dateFormatters.hour.format(new Date(2023, 0, 1, hour % 24));
  return `${at(startHour)}\u2013${at(endHour)}`;
};

/**
 * Re-reads the device's clock, first day of the week and region (call when
 * the app returns to the foreground) and rebuilds the formatters.
 */
export const refreshDeviceFormat = () => {
  Object.assign(deviceFormat, readDeviceFormat());
  const locale = i18n.locale as SupportedLocale;
  Object.assign(dateFormatters, buildDateFormatters(locale));
  Object.assign(numberFormatters, buildNumberFormatters(locale));
};

// Helper function to update formatters when locale changes
export const updateLocale = (locale: SupportedLocale) => {
  i18n.locale = locale;
  Object.assign(dateFormatters, buildDateFormatters(locale));
  Object.assign(numberFormatters, buildNumberFormatters(locale));
};

export { i18n };
export type { SupportedLocale, WeekStartsOn };
