import {
  hourFormatOptions,
  readDeviceFormat,
  resolveIntlLocale,
  resolveWeekStartsOn,
  timeFormatOptions,
  weekStartsOnForRegion,
} from "@/lib/i18n/device-format";

const mockCalendars = jest.fn();
const mockLocales = jest.fn();

jest.mock("expo-localization", () => ({
  getCalendars: () => mockCalendars(),
  getLocales: () => mockLocales(),
}));

const at = (hours: number, minutes = 0) =>
  new Date(2026, 10, 11, hours, minutes);

describe("first day of the week", () => {
  it("uses the device calendar's firstWeekday (1 = Sunday … 7 = Saturday)", () => {
    expect(resolveWeekStartsOn(1, "PT")).toBe(0);
    expect(resolveWeekStartsOn(2, "US")).toBe(1);
    expect(resolveWeekStartsOn(7, null)).toBe(6);
  });

  it("falls back to the region when the calendar does not say", () => {
    expect(resolveWeekStartsOn(null, "US")).toBe(0);
    expect(resolveWeekStartsOn(undefined, "ES")).toBe(1);
    expect(resolveWeekStartsOn(null, "GB")).toBe(1);
    expect(resolveWeekStartsOn(null, "EG")).toBe(6);
  });

  it("ignores an out-of-range firstWeekday", () => {
    expect(resolveWeekStartsOn(0, "ES")).toBe(1);
    expect(resolveWeekStartsOn(8, "US")).toBe(0);
    expect(resolveWeekStartsOn(2.5, "US")).toBe(0);
  });

  it("starts on Monday (ISO) for unknown or missing regions", () => {
    expect(weekStartsOnForRegion(null)).toBe(1);
    expect(weekStartsOnForRegion("ZZ")).toBe(1);
    expect(weekStartsOnForRegion("de")).toBe(1);
    expect(weekStartsOnForRegion("us")).toBe(0);
  });
});

describe("clock", () => {
  it("formats a 24-hour time when the device uses a 24-hour clock", () => {
    const f = new Intl.DateTimeFormat("en-US", timeFormatOptions(true));
    expect(f.format(at(14, 5))).toBe("14:05");
    expect(f.format(at(0, 30))).toBe("00:30");
  });

  it("formats a 12-hour time when the device uses a 12-hour clock, in any language", () => {
    const en = new Intl.DateTimeFormat("en-GB", timeFormatOptions(false));
    expect(en.format(at(14, 5)).toLowerCase().replace(/\s/g, " ")).toMatch(
      /^2:05 pm$/
    );
    const pt = new Intl.DateTimeFormat("pt-PT", timeFormatOptions(false));
    expect(pt.format(at(14, 5))).toMatch(/^2:05/);
  });

  it("keeps the language's convention when the device does not say", () => {
    const pt = new Intl.DateTimeFormat("pt-PT", timeFormatOptions(null));
    expect(pt.format(at(14, 5))).toBe("14:05");
    const en = new Intl.DateTimeFormat("en-US", timeFormatOptions(undefined));
    expect(en.format(at(14, 5))).toMatch(/^2:05\sPM$/);
  });

  it("formats whole hours for time ranges", () => {
    const h24 = new Intl.DateTimeFormat("es-ES", hourFormatOptions(true));
    expect(h24.format(at(0))).toBe("00:00");
    expect(h24.format(at(21))).toBe("21:00");
    const h12 = new Intl.DateTimeFormat("en-US", hourFormatOptions(false));
    expect(h12.format(at(21))).toMatch(/^9\sPM$/);
  });
});

describe("Intl locale", () => {
  it("keeps es-ES and pt-PT for Spanish and Portuguese", () => {
    expect(resolveIntlLocale("es", "MX")).toBe("es-ES");
    expect(resolveIntlLocale("pt", "BR")).toBe("pt-PT");
  });

  it("follows the device region for English", () => {
    expect(resolveIntlLocale("en", "GB")).toBe("en-GB");
    expect(resolveIntlLocale("en", "us")).toBe("en-US");
    expect(resolveIntlLocale("en", null)).toBe("en");
    expect(resolveIntlLocale("en", "419")).toBe("en");
  });
});

describe("readDeviceFormat", () => {
  it("reads the clock, first weekday and region from expo-localization", () => {
    mockCalendars.mockReturnValue([{ uses24hourClock: true, firstWeekday: 2 }]);
    mockLocales.mockReturnValue([{ languageCode: "en", regionCode: "US" }]);
    expect(readDeviceFormat()).toEqual({
      uses24hourClock: true,
      weekStartsOn: 1,
      regionCode: "US",
    });
  });

  it("falls back to the region and no clock preference", () => {
    mockCalendars.mockReturnValue([{ uses24hourClock: null, firstWeekday: null }]);
    mockLocales.mockReturnValue([{ languageCode: "en", regionCode: "US" }]);
    expect(readDeviceFormat()).toEqual({
      uses24hourClock: null,
      weekStartsOn: 0,
      regionCode: "US",
    });
  });

  it("survives expo-localization throwing", () => {
    mockCalendars.mockImplementation(() => {
      throw new Error("no native module");
    });
    mockLocales.mockReturnValue([]);
    expect(readDeviceFormat()).toEqual({
      uses24hourClock: null,
      weekStartsOn: 1,
      regionCode: null,
    });
  });
});
