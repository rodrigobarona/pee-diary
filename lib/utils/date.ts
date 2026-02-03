import { format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';
import { dateFormatters } from '@/lib/i18n';

/**
 * Format a date using the hoisted Intl formatter
 * Uses module-level formatters for performance
 */
export const formatDate = (date: Date | string, style: 'short' | 'medium' | 'long' = 'medium') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFormatters[style].format(d);
};

/**
 * Format time using the hoisted Intl formatter
 */
export const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFormatters.time.format(d);
};

/**
 * Get a relative date label (Today, Yesterday, or formatted date)
 */
export const getRelativeDateLabel = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return 'Today';
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  return dateFormatters.medium.format(d);
};

/**
 * Format date for display in headers
 */
export const formatDateHeader = (date: Date) => {
  return format(date, 'EEEE, MMMM d');
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
