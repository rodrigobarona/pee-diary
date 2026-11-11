import { dateFormatters, getWeekStartsOn } from '@/lib/i18n';
import { isDayKey, parseDayKey } from '@/lib/utils/day';

// A "yyyy-MM-dd" day is read as local midnight, any other string as a moment
const toDate = (date: Date | string): Date => {
  if (typeof date !== 'string') return date;
  return isDayKey(date) ? parseDayKey(date) : new Date(date);
};

/**
 * Format a date using the hoisted Intl formatter
 * Uses module-level formatters for performance
 */
export const formatDate = (date: Date | string, style: 'short' | 'medium' | 'long' = 'medium') => {
  return dateFormatters[style].format(toDate(date));
};

/**
 * Format time using the hoisted Intl formatter
 */
export const formatTime = (date: Date | string) => {
  return dateFormatters.time.format(toDate(date));
};

/**
 * Format date for display in headers
 */
export const formatDateHeader = (date: Date) => {
  const weekday = dateFormatters.weekday.format(date);
  const longDate = dateFormatters.long.format(date);
  return `${weekday}, ${longDate}`;
};

/**
 * date-fns week options with the device's first day of the week (Monday in
 * most of Europe, Sunday in the US), for startOfWeek, endOfWeek and
 * isSameWeek.
 */
export const weekOptions = () => ({ weekStartsOn: getWeekStartsOn() });
