// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-localization
// Mock expo-localization: English, no region and no clock preference, so
// the language's own conventions apply unless a test sets them
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", regionCode: null }],
  getCalendars: () => [{ uses24hourClock: null, firstWeekday: null }],
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  performAndroidHapticsAsync: jest.fn(),
  AndroidHaptics: {
    Confirm: "confirm",
    Reject: "reject",
    Segment_Tick: "segment-tick",
    Toggle_On: "toggle-on",
    Toggle_Off: "toggle-off",
  },
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Icon fonts: a synchronous stand-in that still renders a private-use glyph
// (as the real icon does), so tests can check that glyphs never reach
// accessibility labels, without the font-loading state update after the test
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Icon = ({ name: _name, size: _size, color: _color, ...props }) =>
    React.createElement(Text, props, "");
  Icon.font = {};
  return { __esModule: true, default: Icon };
});
