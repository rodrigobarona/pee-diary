const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withSentryConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Apply NativeWind configuration
const nativeWindConfig = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16, // Required for proper rem scaling
});

// Apply Sentry configuration for source maps and component annotations
module.exports = withSentryConfig(nativeWindConfig, {
  annotateReactComponents: true,
});
