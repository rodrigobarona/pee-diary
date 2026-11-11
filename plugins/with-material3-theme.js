// Expo config plugin: give the Android app a Material 3 theme.
//
// Expo's template sets AppTheme to Theme.AppCompat.DayNight.NoActionBar, so
// the system dialogs the app shows (Alert.alert) are AppCompat dialogs with
// square corners and ALL-CAPS buttons, and the Material date and time
// pickers (@react-native-community/datetimepicker design="material") cannot
// open, as they read their theme from a Material Components app theme.
//
// This plugin:
// - sets AppTheme's parent to Theme.Material3.Light.NoActionBar (the app is
//   light-only for now: app.json userInterfaceStyle "light"), which also
//   makes Alert.alert use ThemeOverlay.Material3.Dialog.Alert: rounded
//   dialog, sentence-case text buttons;
// - sets the Material 3 colour roles from the brand teal (#006D77), so the
//   dialogs and pickers are not the default purple baseline palette;
// - keeps the items Expo and React Native add to AppTheme (edit text
//   background, transparent system bars);
// - adds the Material Components library to the app module, which now
//   references its styles directly (react-native-screens and expo-router
//   already pull in the same version).
const { withAndroidStyles, withAppBuildGradle } = require("expo/config-plugins");

const PARENT_THEME = "Theme.Material3.Light.NoActionBar";
const MATERIAL_DEPENDENCY = "com.google.android.material:material:1.13.0";

// Material 3 light colour roles, brand teal as primary
const COLOR_ROLES = {
  colorPrimary: "#006D77",
  colorOnPrimary: "#FFFFFF",
  colorPrimaryContainer: "#CDE8EA",
  colorOnPrimaryContainer: "#002022",
  colorSecondary: "#4A6365",
  colorOnSecondary: "#FFFFFF",
  colorSecondaryContainer: "#CDE8EA",
  colorOnSecondaryContainer: "#051F21",
  colorTertiary: "#4B607C",
  colorOnTertiary: "#FFFFFF",
  colorTertiaryContainer: "#D3E4FF",
  colorOnTertiaryContainer: "#041C35",
  colorError: "#BA1A1A",
  colorOnError: "#FFFFFF",
  colorSurface: "#F9FAFB",
  colorOnSurface: "#161D1D",
  colorOnSurfaceVariant: "#3F4948",
  colorSurfaceContainerLowest: "#FFFFFF",
  colorSurfaceContainerLow: "#EFF5F5",
  colorSurfaceContainer: "#E9EFEF",
  colorSurfaceContainerHigh: "#E3E9E9",
  colorSurfaceContainerHighest: "#DDE4E4",
  colorOutline: "#6F7979",
  colorOutlineVariant: "#BEC8C9",
};

function setItem(style, name, value) {
  style.item = (style.item ?? []).filter((item) => item.$.name !== name);
  style.item.push({ $: { name }, _: value });
}

function withMaterial3Styles(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];
    const appTheme = styles.find((style) => style.$.name === "AppTheme");
    if (!appTheme) {
      throw new Error("with-material3-theme: AppTheme not found in styles.xml");
    }

    appTheme.$.parent = PARENT_THEME;
    for (const [name, value] of Object.entries(COLOR_ROLES)) {
      setItem(appTheme, name, value);
    }
    return config;
  });
}

function withMaterialDependency(config) {
  return withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;
    if (gradle.includes(MATERIAL_DEPENDENCY)) {
      return config;
    }
    const anchor = /dependencies\s*\{/;
    if (!anchor.test(gradle)) {
      throw new Error(
        "with-material3-theme: no dependencies block in app/build.gradle"
      );
    }
    config.modResults.contents = gradle.replace(
      anchor,
      (match) =>
        `${match}\n    // Material 3 app theme (plugins/with-material3-theme.js)\n    implementation("${MATERIAL_DEPENDENCY}")`
    );
    return config;
  });
}

module.exports = function withMaterial3Theme(config) {
  return withMaterialDependency(withMaterial3Styles(config));
};
