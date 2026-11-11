// (jest.mock calls are hoisted above the imports)
import { render, screen } from "@testing-library/react-native";

import { TimeGroupSummary } from "@/components/diary/time-group-summary";
import type { DiaryEntry } from "@/lib/store/types";

// The time-of-day rows on Today follow the device's clock, and screen
// readers get words, never icon-font glyphs.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", regionCode: "GB" }],
  getCalendars: () => [{ uses24hourClock: true, firstWeekday: 2 }],
}));

jest.mock("@/lib/i18n/context", () => {
  const { i18n } = jest.requireActual("@/lib/i18n");
  return {
    useI18n: () => ({
      locale: "en",
      formatVersion: 0,
      setLocale: () => {},
      t: (key: string, options?: Record<string, unknown>) =>
        i18n.t(key, { locale: "en", ...options }),
    }),
  };
});

// Reanimated needs its native module; the press feedback is not under test
jest.mock("@/components/ui/animated-pressable", () => {
  const { Pressable } = jest.requireActual("react-native");
  return {
    AnimatedPressable: ({
      feedback: _feedback,
      highlightColor: _highlightColor,
      ...props
    }: Record<string, unknown>) => <Pressable {...props} />,
  };
});


// Private-use areas of the icon fonts
const GLYPHS = /[-]|[\u{F0000}-\u{FFFFD}]/u;

const at = (hours: number, minutes = 0) =>
  new Date(2026, 10, 11, hours, minutes).toISOString();

const entries: DiaryEntry[] = [
  { id: "1", type: "urination", timestamp: at(7, 30), volume: "medium", urgency: 2 } as DiaryEntry,
  { id: "2", type: "fluid", timestamp: at(8), drinkType: "water", amount: 250 } as DiaryEntry,
  { id: "3", type: "fluid", timestamp: at(9), drinkType: "tea", amount: 200 } as DiaryEntry,
];

describe("TimeGroupSummary", () => {
  it("shows each time of day in the device's 24-hour clock", () => {
    render(<TimeGroupSummary entries={entries} />);
    expect(screen.getByText("00:00–05:00")).toBeTruthy();
    expect(screen.getByText("05:00–12:00")).toBeTruthy();
    expect(screen.getByText("21:00–00:00")).toBeTruthy();
  });

  it("names each time of day as one button, in words", () => {
    render(<TimeGroupSummary entries={entries} onPeriodPress={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    const morning = buttons[1].props.accessibilityLabel as string;
    expect(morning).toBe(
      "Morning, from 05:00 to 12:00, 1 void, 2 drinks, 450 millilitres"
    );
    for (const button of buttons) {
      expect(button.props.accessibilityLabel).not.toMatch(GLYPHS);
    }
    expect(buttons[0].props.accessibilityLabel).toContain("No entries yet");
  });
});
