import { startOfWeek, endOfWeek } from 'date-fns';
import { dateFormatters } from '@/lib/i18n';
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
 * Get the start and end of the current week
 */
export const getCurrentWeekRange = () => {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
};

/**
 * Format a date range for display
 */
export const formatDateRange = (start: Date, end: Date) => {
  return `${dateFormatters.dayMonth.format(start)} - ${dateFormatters.dayMonth.format(end)}`;
};
