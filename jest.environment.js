// Test environment: React Native's, run in a fixed time zone that is not UTC.
//
// Diary days are local calendar days, and bugs that read a UTC date as a
// local one (or the reverse) do not show when the computer running the tests
// is on UTC (Lisbon in winter, most CI machines). Every test file therefore
// runs in America/New_York (UTC-5, UTC-4 in summer) unless it picks another
// zone with a docblock at the top of the file:
//   /** @jest-environment-options {"timezone": "Atlantic/Azores"} */
const path = require("path");

const ReactNativeEnvironment = require(require.resolve(
  "@react-native/jest-preset/jest/react-native-env.js",
  { paths: [path.dirname(require.resolve("jest-expo/package.json"))] }
));

const DEFAULT_TIME_ZONE = "America/New_York";

module.exports = class TimeZoneEnvironment extends ReactNativeEnvironment {
  constructor(config, context) {
    super(config, context);
    // Node applies a change of process.env.TZ at once, in every context
    process.env.TZ =
      config.projectConfig.testEnvironmentOptions?.timezone ??
      DEFAULT_TIME_ZONE;
  }
};
