const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Keep 1rem = 16 on native, as it was under NativeWind 4 (the v5 default is 14).
  inlineRem: 16,
});
