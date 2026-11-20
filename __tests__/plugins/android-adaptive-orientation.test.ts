// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addOrientationPolicy } = require("../../plugins/with-android-adaptive-orientation");

const MAIN_ACTIVITY = `package care.eleva.peediary
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"
}
`;

describe("addOrientationPolicy (Android: portrait on phones only)", () => {
  const out = addOrientationPolicy(MAIN_ACTIVITY);

  it("applies the policy right after the activity is created", () => {
    expect(out).toMatch(/super\.onCreate\(null\)\n\s+applyOrientationPolicy\(\)\n/);
  });

  it("re-applies it on every configuration change (fold, unfold, resize)", () => {
    expect(out).toContain("override fun onConfigurationChanged(newConfig: Configuration)");
    expect(out).toContain("applyOrientationPolicy(newConfig)");
  });

  it("locks portrait below 600dp, measured on the display, not the window", () => {
    expect(out).toContain("windowManager.maximumWindowMetrics.bounds");
    expect(out).toContain("if (smallestWidthDp < 600) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT");
    expect(out).toContain("else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED");
  });

  it("adds the imports once and keeps the class closed", () => {
    expect(out.match(/import android\.content\.pm\.ActivityInfo/g)).toHaveLength(1);
    expect(out.match(/import android\.os\.Build/g)).toHaveLength(1);
    expect(out.trimEnd().endsWith("}")).toBe(true);
    // Balanced braces: the methods went inside the class
    expect((out.match(/{/g) ?? []).length).toBe((out.match(/}/g) ?? []).length);
  });

  it("is idempotent (prebuild may run more than once)", () => {
    expect(addOrientationPolicy(out)).toBe(out);
  });
});
