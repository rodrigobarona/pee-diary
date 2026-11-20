// Expo config plugin: portrait on phones only, on Android (and Esc as back,
// for hardware keyboards on the same large screens).
//
// app.json keeps "orientation": "portrait", which iOS needs (the iPhone app
// is portrait). On Android that becomes android:screenOrientation="portrait"
// on the activity, and on large screens it backfires:
// - Android 16 (targetSdk 36) ignores the lock on screens 600dp or wider,
//   so the app rotates there anyway;
// - Android 15 and earlier honour it and letterbox the app (a phone-shaped
//   window with black bars) on an unfolded foldable in landscape or on a
//   tablet, which fails Google Play's baseline large-screen quality tier.
//
// So the activity declares no orientation, and MainActivity locks portrait
// itself when the display's smallest width is under 600dp (a phone, or a
// foldable folded), and lifts the lock otherwise. It decides again on every
// configuration change, so folding and unfolding switch between the two
// without restarting the activity (configChanges includes smallestScreenSize).
// It measures the largest window the display allows, not the current
// window: once letterboxed in portrait, the window itself is narrow and
// would keep the lock forever.
const {
  withAndroidManifest,
  withMainActivity,
} = require("expo/config-plugins");

const MARKER = "eleva-adaptive-orientation";
// Material's medium breakpoint (lib/theme/styles.ts BREAKPOINTS.medium).
// The generated code rounds the display's width down (toInt), so a display
// 599.9dp wide still counts as a phone, as it does for the app's layouts.
const PHONE_MAX_SMALLEST_WIDTH_DP = 600;

function withUnlockedManifest(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const main = app?.activity?.find(
      (activity) => activity.$["android:name"] === ".MainActivity"
    );
    if (main) {
      main.$["android:screenOrientation"] = "unspecified";
    }
    return config;
  });
}

const IMPORTS = [
  "import android.content.pm.ActivityInfo",
  "import android.content.res.Configuration",
  "import android.os.Build",
  "import android.os.SystemClock",
  "import android.view.KeyEvent",
];

// Esc handed back by JavaScript within this time leaves the app alone
const ESCAPE_FALLBACK_MS = 500;

const METHODS = `
  // @generated begin ${MARKER}
  // Phones (smallest width under ${PHONE_MAX_SMALLEST_WIDTH_DP}dp) stay in portrait; unfolded
  // foldables and tablets follow the device (plugins/with-android-adaptive-orientation.js)
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applyOrientationPolicy(newConfig)
  }

  private fun applyOrientationPolicy(config: Configuration = resources.configuration) {
    // The display's smallest width in dp (Android 11+), else the window's
    val smallestWidthDp =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val bounds = windowManager.maximumWindowMetrics.bounds
        (minOf(bounds.width(), bounds.height()) / resources.displayMetrics.density).toInt()
      } else {
        config.smallestScreenWidthDp
      }
    val wanted =
      if (smallestWidthDp < ${PHONE_MAX_SMALLEST_WIDTH_DP}) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    if (requestedOrientation != wanted) {
      requestedOrientation = wanted
    }
  }

  // Esc on a hardware keyboard (tablets, foldables with a keyboard case,
  // desktop windows) does what back does: closes the dialog, sheet or form,
  // or goes back a screen (Google Play large-screen quality, Tier 2)
  // ReactActivity.onBackPressed hands back to JavaScript (navigation) on
  // every Android version; the back dispatcher would not below Android 16,
  // where React Native registers no callback, and would close the app
  @Suppress("DEPRECATION")
  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_ESCAPE) {
      lastEscapeAt = SystemClock.uptimeMillis()
      onBackPressed()
      return true
    }
    return super.onKeyUp(keyCode, event)
  }

  // When Esc reaches a screen with nothing to close (Today, History),
  // JavaScript hands it back here to leave the app: Esc never leaves it,
  // only back does
  private var lastEscapeAt = 0L
  private fun isEscapeFallback(): Boolean =
    SystemClock.uptimeMillis() - lastEscapeAt < ${ESCAPE_FALLBACK_MS}
  // @generated end ${MARKER}
`;

/** Adds the orientation policy to MainActivity.kt's source (idempotent). */
function addOrientationPolicy(src) {
  if (src.includes(`@generated begin ${MARKER}`)) {
    return src;
  }
  for (const line of IMPORTS) {
    if (!src.includes(line)) {
      src = src.replace(/^(package [^\n]+\n)/, `$1${line}\n`);
    }
  }
  // Decide before the first frame, right after the activity is created
  src = src.replace(
    /(\n(\s*)super\.onCreate\([^)]*\)\n)/,
    `$1$2applyOrientationPolicy()\n`
  );
  // Esc with nothing left to close: stay in the app
  src = src.replace(
    /(override fun invokeDefaultOnBackPressed\(\) \{\n)/,
    `$1      if (isEscapeFallback()) return\n`
  );
  // The methods go at the end of the class body
  return src.replace(/\n}\s*$/, `\n${METHODS}}\n`);
}

function withOrientationPolicy(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== "kt") {
      throw new Error(`${MARKER}: MainActivity must be Kotlin`);
    }
    config.modResults.contents = addOrientationPolicy(config.modResults.contents);
    return config;
  });
}

module.exports = function withAndroidAdaptiveOrientation(config) {
  return withOrientationPolicy(withUnlockedManifest(config));
};
module.exports.addOrientationPolicy = addOrientationPolicy;
