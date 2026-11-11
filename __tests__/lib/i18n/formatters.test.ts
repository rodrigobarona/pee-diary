// The shared formatters follow the device's 24-hour clock, first day of the
// week and region, whatever the app language. (jest.mock is hoisted above
// the imports.)
import {
  dateFormatters,
  formatHourRange,
  getWeekStartsOn,
  getWeekdayLabels,
  getWeekdayLongLabels,
  intlLocale,
  updateLocale,
} from "@/lib/i18n";
import { formatTime, weekOptions } from "@/lib/utils/date";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", regionCode: "GB" }],
  getCalendars: () => [{ uses24hourClock: true, firstWeekday: 1 }],
}));

describe("shared date formatters (24-hour clock, Sunday first, GB)", () => {
  afterEach(() => updateLocale("en"));

  it("uses the device region for English and es-ES / pt-PT otherwise", () => {
    expect(intlLocale("en")).toBe("en-GB");
    expect(intlLocale("es")).toBe("es-ES");
    expect(intlLocale("pt")).toBe("pt-PT");
  });

  it("formats times in the device's 24-hour clock in English", () => {
    updateLocale("en");
    expect(formatTime(new Date(2026, 10, 11, 19, 3))).toBe("19:03");
    expect(dateFormatters.time.format(new Date(2026, 10, 11, 7, 6))).toBe(
      "07:06"
    );
  });

  it("starts weeks on the device's first weekday", () => {
    expect(getWeekStartsOn()).toBe(0);
    expect(weekOptions()).toEqual({ weekStartsOn: 0 });
    expect(getWeekdayLongLabels()[0]).toBe("Sunday");
    expect(getWeekdayLongLabels()[1]).toBe("Monday");
    expect(getWeekdayLabels()).toHaveLength(7);
  });

  it("formats hour ranges in the device clock", () => {
    expect(formatHourRange(0, 5)).toBe("00:00–05:00");
    expect(formatHourRange(21, 24)).toBe("21:00–00:00");
  });

  it("names weekdays in the app language", () => {
    updateLocale("pt");
    expect(getWeekdayLongLabels()[1]).toBe("segunda-feira");
    updateLocale("es");
    expect(getWeekdayLongLabels()[1]).toBe("lunes");
  });
});
