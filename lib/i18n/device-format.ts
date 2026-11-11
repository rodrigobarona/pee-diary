import { getCalendars, getLocales } from 'expo-localization';

/**
 * The device's own date and time conventions, read from the system settings
 * (iOS: Settings > General > Date & Time and Language & Region; Android:
 * Settings > System > Date & time and Regional preferences), so that the
 * app's dates and times match the system pickers, the lock screen and the
 * notifications.
 */

/** date-fns day index: 0 = Sunday … 6 = Saturday. */
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Regions whose week starts on Sunday or Saturday (CLDR weekData, the main
// cases). Every other region, including all of Europe, starts on Monday
// (ISO 8601).
const SUNDAY_FIRST_REGIONS = new Set([
  'AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CN', 'CO', 'DM',
  'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP', 'KE',
  'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA',
  'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW',
  'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW',
]);
const SATURDAY_FIRST_REGIONS = new Set([
  'AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM',
  'QA', 'SD', 'SY',
]);

/** First day of the week for a region code (ISO 3166-1), Monday by default. */
export function weekStartsOnForRegion(
  regionCode: string | null | undefined
): WeekStartsOn {
  const region = regionCode?.toUpperCase();
  if (region && SUNDAY_FIRST_REGIONS.has(region)) return 0;
  if (region && SATURDAY_FIRST_REGIONS.has(region)) return 6;
  return 1;
}

/**
 * First day of the week as date-fns expects it. Uses the device calendar's
 * firstWeekday (1 = Sunday … 7 = Saturday, which follows the user's choice
 * on iOS and the region on Android), and the region when that is missing.
 */
export function resolveWeekStartsOn(
  firstWeekday: number | null | undefined,
  regionCode: string | null | undefined
): WeekStartsOn {
  if (
    typeof firstWeekday === 'number' &&
    Number.isInteger(firstWeekday) &&
    firstWeekday >= 1 &&
    firstWeekday <= 7
  ) {
    return (firstWeekday - 1) as WeekStartsOn;
  }
  return weekStartsOnForRegion(regionCode);
}

/**
 * Intl options for hours and minutes in the device's clock: 24-hour
 * ("14:05") or 12-hour ("2:05 PM") as the user set it, whatever the app
 * language. When the device does not say, the language's own convention
 * applies.
 */
export function timeFormatOptions(
  uses24hourClock: boolean | null | undefined
): Intl.DateTimeFormatOptions {
  if (uses24hourClock === true) {
    return { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  }
  if (uses24hourClock === false) {
    return { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' };
  }
  return { hour: 'numeric', minute: '2-digit' };
}

/** Intl options for a whole hour ("14:00" or "2 PM"), for time ranges. */
export function hourFormatOptions(
  uses24hourClock: boolean | null | undefined
): Intl.DateTimeFormatOptions {
  if (uses24hourClock === true) {
    return { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  }
  if (uses24hourClock === false) {
    return { hour: 'numeric', hourCycle: 'h12' };
  }
  return { hour: 'numeric' };
}

/**
 * The Intl locale for dates, times and numbers. Spanish and Portuguese use
 * the European conventions (es-ES, pt-PT), as in the Eleva monorepo. English
 * follows the device region (en-GB writes 11 November, en-US November 11),
 * and plain "en" when the region is unknown.
 */
export function resolveIntlLocale(
  appLanguage: string,
  regionCode: string | null | undefined
): string {
  if (appLanguage === 'es') return 'es-ES';
  if (appLanguage === 'pt') return 'pt-PT';
  if (appLanguage === 'en') {
    const region = regionCode?.toUpperCase();
    return region && /^[A-Z]{2}$/.test(region) ? `en-${region}` : 'en';
  }
  return appLanguage;
}

export interface DeviceFormat {
  uses24hourClock: boolean | null;
  weekStartsOn: WeekStartsOn;
  regionCode: string | null;
}

/** Reads the device settings now (they can change while the app runs). */
export function readDeviceFormat(): DeviceFormat {
  const calendar = safe(() => getCalendars()[0], undefined);
  const locale = safe(() => getLocales()[0], undefined);
  const regionCode = locale?.regionCode ?? null;
  return {
    uses24hourClock:
      typeof calendar?.uses24hourClock === 'boolean'
        ? calendar.uses24hourClock
        : null,
    weekStartsOn: resolveWeekStartsOn(calendar?.firstWeekday, regionCode),
    regionCode,
  };
}

function safe<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}
