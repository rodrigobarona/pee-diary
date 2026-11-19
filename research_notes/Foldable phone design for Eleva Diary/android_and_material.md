# Android large-screen and foldable platform rules, Google Play expectations, and Material 3 adaptive guidance (as of November 2026)

Context for the reader: the app is React Native/Expo, targetSdk 36, `android:screenOrientation="portrait"`, and `configChanges` includes orientation|screenSize|screenLayout|smallestScreenSize, so the activity is not recreated. Most Google sources describe Jetpack Compose APIs. Where a finding is Compose-specific, the transferable part is the rule or number, not the API.

## 1. Android 16 (API 36) and Android 17 (API 37) large-screen behaviour changes, and the Play deadlines that force them

### Takeaway
An app targeting API 36 that runs on a display with smallest width ≥ 600dp has its portrait lock, `resizeableActivity=false` and min/max aspect ratio ignored. It fills the whole window with no pillarboxing. A temporary opt-out property exists for API 36 only. It stops working once the app targets API 37 (Android 17), and Google Play will require API 37 for new apps and updates in **August 2027**. Displays under sw600dp (phone cover screens, normal phones) and games are exempt. Users can still pick an aspect ratio per app in device settings.

### Cited Findings
**Android 16 rule (introduced with Android 16 in 2025, announced January 2025)**
- Rule: "For apps targeting Android 16 (API level 36), orientation, resizability, and aspect ratio restrictions no longer apply on displays with smallest width >= 600dp. Apps fill the entire display window, regardless of aspect ratio or a user's preferred orientation, and pillarboxing isn't used." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Ignored manifest attributes and APIs, "across large screen devices in full-screen and multi-window modes": `screenOrientation`, `resizableActivity`, `minAspectRatio`, `maxAspectRatio`, `setRequestedOrientation()`, `getRequestedOrientation()`. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Ignored orientation values: `portrait`, `reversePortrait`, `sensorPortrait`, `userPortrait`, `landscape`, `reverseLandscape`, `sensorLandscape`, `userLandscape`. "`android:resizeableActivity="false"`, `android:minAspectRatio`, and `android:maxAspectRatio` have no effect." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Exceptions: (1) games, based on the `android:appCategory` flag; (2) "Users explicitly opting in to the app's default behavior in aspect ratio settings of the device"; (3) "Screens that are smaller than `sw600dp`". — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Temporary opt-out: `<property android:name="android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY" android:value="true" />`, set per `<activity>` or for the whole `<application>`. Opting out restores "the previous behavior of being placed in compatibility mode". — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- When the opt-out stops working: "The opt-out is temporary and won't apply when targeting API level 37... for apps targeting API level 37, orientation, resizability, and aspect ratio restrictions are ignored on displays that are at least `sw600dp`." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- To test before targeting 36, enable the compat flag `UNIVERSAL_RESIZABLE_BY_DEFAULT` through the app compatibility framework. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Breakages Google expects: "stretched layouts and off-screen animations and components". "Allowing device rotation results in more activity re-creation, which can result in losing user state if not properly preserved." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Other API 36 changes that affect UI on all form factors: apps can no longer opt out of edge-to-edge (`windowOptOutEdgeToEdgeEnforcement` is disabled on Android 16 devices). Predictive back system animations are on by default, `onBackPressed` is not called and `KEYCODE_BACK` is not dispatched, unless the app sets `android:enableOnBackInvokedCallback="false"`. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)

**Android 17 (API 37). Beta announced 13 Feb 2026; I/O update 19 May 2026**
- "Android 17 (API level 37) removes the developer opt-out for orientation and resizability restrictions on large screen devices (sw > 600 dp)... No new changes have been introduced since Android 16, but the developer opt-out is no longer possible." Large screen means "the smaller dimension of the display is greater than or equal to 600 dp". — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- The ignored list is the same as Android 16: screenOrientation and setRequestedOrientation (all portrait/landscape variants), resizeableActivity (all), minAspectRatio (all), maxAspectRatio (all). It still does not apply below sw600dp or to games marked with `android:appCategory`. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Official Android 17 behaviour page: "Developers have the option to opt out of these changes with SDK 36, but this opt-out will no longer be available for apps that target Android 17 (API level 37) or higher." — [Android 17 behavior changes (apps targeting 17)](https://developer.android.com/about/versions/17/behavior-changes-17)
- Play deadline: "For Google Play, new apps and updates will be required to target API level 37, making this behavior mandatory for distribution in August 2027." — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Google's guidance for the change: "Apps will need to support landscape and portrait layouts for display sizes in the full range of aspect ratios in which users can choose to use apps, including resizable windows." Common issues are "skewed or misoriented camera previews, stretched layouts, inaccessible buttons, or loss of user state when handling configuration changes". Fixes: cap component width (example `widthIn(max = 300.dp)`) and make bottom-anchored forms scrollable so Save/Login buttons are not pushed off-screen in landscape. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Testing advice: Android 17 Beta with the Pixel Tablet and Pixel Fold emulators and `targetSdkPreview = "CinnamonBun"`, or the `UNIVERSAL_RESIZABLE_BY_DEFAULT` compat flag. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Android 17 change for all apps, whatever their target: "when the device's configuration changes (for example, through rotation), and this is not handled by the app itself, the previous IME visibility is not restored." — [Android 17 behavior changes (all apps)](https://developer.android.com/about/versions/17/behavior-changes-all)
- Google's I/O 2026 framing: "Android 17 (API level 37) sets a new quality baseline by removing that developer opt-out... When you target API level 37, your app must be capable of adapting to a variety of display sizes." — [Android Developers Blog, 19 May 2026](https://developer.android.com/blog/posts/adaptive-development-for-the-expanding-android-ecosystem)

**Current Google Play target API deadlines**
- From **31 Aug 2026**, new apps and app updates must target **API 36**. Existing apps must target API 35 or higher to stay available to new users on newer Android versions. Developers can request an extension to **1 Nov 2026**. — [Meet Google Play's target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)
- The API 37 requirement arrives in **August 2027**, per the Android blog above. I found no Play Console help page that gives the exact August 2027 day; the usual pattern is 31 August.

**User per-app aspect ratio overrides**
- Since Android 14 (API 34), large-screen devices offer a per-app aspect-ratio menu in device settings. Options include 3:4, 1:1, full screen, manufacturer-defined values, and reset to the app default. Full screen makes the app resizable, as if `resizeableActivity="true"` were set. — [Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)
- "Users can still override aspect ratio in Settings even if the app opts out." `OVERRIDE_ANY_ORIENTATION_TO_USER` does not apply to apps that opt out. — [Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)
- Developer opt-outs from user overrides, on `<application>`: `android.window.PROPERTY_COMPAT_ALLOW_USER_ASPECT_RATIO_OVERRIDE = false` removes the app from the settings list. `android.window.PROPERTY_COMPAT_ALLOW_USER_ASPECT_RATIO_FULLSCREEN_OVERRIDE = false` removes only the full-screen option. Google recommends not restricting at all and using window size classes instead. — [Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)
- Device-level overrides can be toggled with `adb shell am compat enable|disable <OVERRIDE_NAME> <package>`, and listed with `adb shell dumpsys platform_compat | grep <package>`. Examples are `OVERRIDE_MIN_ASPECT_RATIO_MEDIUM` (3:2) and `OVERRIDE_MIN_ASPECT_RATIO_LARGE` (16:9). — [Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)
- On large screens since Android 12 (API 31), all apps run in multi-window mode regardless of app configuration. — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)

### Inferences
- For this app at targetSdk 36 with no opt-out property: on any window with sw ≥ 600dp, such as an unfolded inner display, a tablet, or desktop windowing, the `portrait` lock is already ignored today. The app rotates to landscape and is resized freely in split-screen. Unless `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY` is in the manifest, this is current behaviour, not a 2027 problem.
- Phone cover screens and ordinary phones are below sw600dp, so the portrait lock still holds there. The app therefore has to handle a portrait-locked compact layout on the cover screen and a free-rotating, resizable layout on the inner screen within the same session.
- Because `configChanges` includes orientation|screenSize|screenLayout|smallestScreenSize, folding, unfolding, rotating and resizing will not recreate the activity. React Native receives a dimension change (`Dimensions`/`useWindowDimensions`) instead, so JS state such as scroll position and form text survives naturally. The risk is layouts that read dimensions once and cache them. The Android 17 IME change applies only to configuration changes the app does not handle, so it should not affect these handled changes. Verify keyboard state during fold and unfold anyway.
- Adding the opt-out property buys time only until the app targets API 37, which Play forces in August 2027. Once targeting 37, it does nothing.
- A bladder diary should not set `android:appCategory="game"` to escape the rule. It would misclassify the app, and Google lists games as the only category exception.

### Gaps
- I could not find a Play Console Help page that gives the exact API 37 deadline day (only "August 2027") or the extension window.
- The Android 17 stable release date was not stated on the pages I read. The blogs place the Android 17 Beta in February 2026 and the I/O launch framing in May 2026.
- No source gives the sw (dp) values of specific cover and inner screens (Pixel 10 Pro Fold, Galaxy Z Fold7). The claim that "cover screens are below 600dp" is an inference from typical phone widths.

## 2. Google Play quality guidelines, tiers, badges and listing expectations

### Takeaway
The "large screen app quality guidelines" were replaced in 2026 by the **Adaptive app quality guidelines**. The previous version is archived as of 2026-01-21, and Tier 2 was revised 2026-04-07. The tiers are **Tier 3, Adaptive ready** (baseline), **Tier 2, Adaptive optimized**, and **Tier 1, Adaptive differentiated**. Since May 2026, Play shows an **"Optimized for large screens" badge**. Developers apply for it through a Google form after meeting Tier 2 or Tier 1. Since 2022, Play has also said it ranks quality apps higher on large screens, shows alerts on low-quality ones, and splits ratings by device type.

### Cited Findings
- The adaptive app quality guidelines "replace and extend the guidance formerly provided in the large screen app quality guidelines". The archive lists "2026-01-21 — Large screen app quality guidelines" and "2026-04-07 — Tier 2". — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- Tier definitions:
  - **Tier 3 (basic), Adaptive ready**: "Your app runs full screen (or full window in multi-window mode) on all devices, but app layout might not be ideal. The app is not letterboxed; it does not run in compatibility mode. Users can complete critical task flows... basic support for external input devices."
  - **Tier 2 (better), Adaptive optimized**: "layout optimizations for all screen sizes and device configurations along with enhanced support for external input devices."
  - **Tier 1 (best), Adaptive differentiated**: "a user experience designed for the device or display... supports multitasking, foldable postures, drag and drop, and stylus input."
  — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- "Tier 3 (Adaptive ready) defines the baseline quality standard for apps on foldables and large screens on Google Play, while Tier 2 and Tier 1 help your app qualify for enhanced promotion and store badging." — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- Badge: "Complete Tier 2... to optimize your app for all screen sizes; Tier 1 to create a differentiated experience made for large screens. Then, get your Google Play badge!" The page links to a Google Form to apply. — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- On 19 May 2026 Google said: "we've rolled out a new badge in Google Play. Apps meeting adaptive quality standards now earn an 'Optimized for large screens' badge". The same post cites 580M+ large-screen devices and says large-screen users spend about 5x more than phone-only users. — [Android Developers Blog, 19 May 2026](https://developer.android.com/blog/posts/adaptive-development-for-the-expanding-android-ecosystem)
- Play said in October 2026 that on Googlebook, "apps optimized for large screens are shown front and center". — [Google blog, 13 Oct 2026](https://blog.google/products-and-platforms/platforms/google-play/google-play-updates-october-2026/)
- 2022 Play changes that still form the basis: ranking and featuring on large screens prioritise apps that meet the quality guidelines, in both search and home recommendations. Apps that fail basic compatibility, such as portrait and landscape support, trigger alerts to users on large screens. Ratings and reviews are split by device type (tablets and foldables, ChromeOS, Wear, Auto), and developers can preview this in Play Console. — [Android Developers Blog, 16 Mar 2022](https://android-developers.googleblog.com/2022/03/helping-users-discover-quality-apps-on.html)
- **Tier 3 checklist** (from [Tier 3, Adaptive ready](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-3)):
  - `Config_Changes`: the app fills the available display area and is not letterboxed or in compatibility mode. It keeps state through rotation, fold and unfold, and window resizing: scroll position kept, typed text and keyboard state retained, media resumes.
  - `Config_Combinations`: handles chains of changes, such as a resize then a rotation, or a rotation then a fold.
  - `Multi-Window_Functionality`: fully functional in multi-window mode.
  - `Multi-Resume`: keeps updating the UI when it is not the focused app, and releases and regains camera or microphone.
  - `Camera_Preview` and `Media_Projection`: correct orientation and proportions in all states.
  - `Keyboard_Input`: switches between external and virtual keyboards without relaunching.
  - `Mouse_Trackpad_Basic`: click, select and scroll.
  - `Stylus_Basic` and `Stylus_Text_Input`: automatic for standard EditText.
  - Test `T-Config_Orientation`: test on sw ≥ 600dp, including both the **Foldable (1:1 inner display)** and **Foldable (4:3 inner display)** emulators.
- **Tier 2 checklist** (from [Tier 2, Adaptive optimized](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)):
  - `Responsive_adaptive_layouts`: adaptive layouts driven by window size classes. Examples are navigation rails that expand into panels, grids that scale column count, columns of text, and multi-pane canonical layouts.
  - `UI_Secondary_Elements`:
    - "Bottom sheets are not full width on large screens (apply a maximum width)".
    - Buttons and text fields are not full width.
    - Small modals do not cover the whole screen.
    - Context menus appear next to the selected item.
    - "Navigation rails replace navigation bars for better ergonomics on large screens".
    - "Navigation drawers are updated to expanded navigation rails".
    - Dialogs use the latest Material component.
    - Images are not stretched or cropped.
  - `Touch_Targets` ≥ 48dp.
  - `Drawable_Focus`: focus state for interactive custom drawables.
  - Keyboard items: Tab and arrow navigation, shortcuts, Enter to send, and Esc to close modals, dialogs and menus or abort edits. Also right-click context menus, Ctrl+scroll and pinch zoom, and hover states.
- Tier 1 is organised by "experiences": Desktop, Foldables, Camera/Audio, Stylus, Cars, TV, XR, Games, Widgets. — [Tier 1](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-1)
- Recommended test devices: Googlebook (160 ppi), foldable 1:1 inner (802x802 dp), foldable 4:3 inner (1024x768 dp), 8" tablet (1024x640 dp), 10.5" tablet (1280x800 dp), 13" Chromebook (1600x900 dp). Emulators: Phone > Foldable (1:1 inner display), Phone > Foldable (4:3 inner display), Phone > Pixel Fold, Tablet > Medium Tablet, Desktop > Desktop (Preview), the last in Android Studio Canary. — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- Store listing: upload screenshots of tablets and foldables, "including both square (1:1) and wide (4:3 landscape or 3:4 portrait) unfolded inner displays as well as folded outer screens (10:16 portrait or 16:10 landscape, and 9:16 or 16:9, respectively)." — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)

### Inferences
- Tier 3 is effectively what Play treats as the baseline. A portrait-only app that opts out and gets letterboxed on the inner screen fails `Config_Changes` / `T-Config_Orientation` outright.
- For badge eligibility, the Tier 2 items most relevant to this app are:
  - a navigation rail instead of the bottom tab bar at ≥ 600dp
  - bottom sheets and modal forms with a maximum width
  - buttons and text fields that do not stretch
  - Esc closing the entry modal, and Tab navigation through the entry form
  - hover and focus states on custom drawables such as the centre + button and chart bars
- Play has not described any automated Play Console "flag" or pre-launch report check for large-screen tiers in the sources I read. Enforcement is ranking, alerts and badges, plus the platform's own target-SDK rule.

### Gaps
- I found no official Play Console Help article listing exact badge criteria, how badge status is shown in Console, or whether badging is automatic or review-based. The developer page links a Google Form.
- No primary source confirms a Play Store search filter for large-screen apps, or a "large screen ready" rating label, in 2025–2026. Third-party ASO sites (appsops.store) claim tier-based ranking enforcement in "fall 2026". These are unverified and should not be relied on.
- Whether the 2022 "alert" on large-screen listings still exists in its original form was not confirmed in 2026 sources.
- I did not find whether the Play pre-launch report runs large-screen or foldable checks.

## 3. Material 3 adaptive layout: window size classes, canonical layouts, navigation, widths, sheets and dialogs

### Takeaway
Width breakpoints are: **compact <600dp, medium 600–839dp, expanded 840–1199dp, large 1200–1599dp, extra-large ≥1600dp**. Height breakpoints are: **compact <480dp, medium 480–899dp, expanded ≥900dp**. Material's May 2026 update renamed "window size classes" to "breakpoints". The default is a navigation bar when width or height is compact (or in tabletop posture) and a navigation rail otherwise. The navigation drawer has been replaced by the expanded rail. The canonical layouts are list-detail, supporting pane and feed. Bottom sheets must have a maximum width on large screens (Compose and MDC default is 640dp), or switch to a side sheet, floating sheet or menu.

### Cited Findings
- **Width classes**, with the share of devices each covers:

  | Class | Width | Devices |
  |---|---|---|
  | Compact | < 600dp | 99.96% of phones in portrait |
  | Medium | 600 ≤ w < 840dp | 93.73% of tablets in portrait; "most large unfolded inner displays in portrait" |
  | Expanded | 840 ≤ w < 1200dp | 97.22% of tablets in landscape; "most large unfolded inner displays in landscape are at least expanded width" |
  | Large | 1200 ≤ w < 1600dp | large tablets |
  | Extra-large | ≥ 1600dp | desktop |

  — [Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- **Height classes**: compact < 480dp (99.78% of phones in landscape), medium 480 ≤ h < 900dp (96.56% of tablets in landscape, 97.59% of phones in portrait), expanded ≥ 900dp (94.25% of tablets in portrait). — [Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- Where height matters: "consider the height window size class for scenarios such as phones or open flippables in landscape orientation; the window width is typically medium, but window height is compact, in which case two pane layouts are not practical." — [Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- Classes depend on the window, not the device: "Window size classes are not intended for isTablet‑type logic... The window size class can change throughout the lifetime of your app." Recommended design order: "first optimize your layout for the expanded width size class... Then decide what layout makes sense for the medium width size class." — [Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- Large and extra-large were added to the Android API beyond Material's original compact/medium/expanded. In Compose, enable them with `currentWindowAdaptiveInfo(supportLargeAndXLargeWidth = true)`. `currentWindowAdaptiveInfoV2()` enables them by default. WindowManager 1.5.0 introduced the two new breakpoints. — [Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes); [Make your app fold aware](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware); [Android Developers Blog, Material 3 Adaptive 1.2.0 stable, Oct 2025](https://android-developers.googleblog.com/2025/10/material-3-adaptive-120-is-stable.html)
- Unfolded inner displays: "Square (1:1) inner displays: Generally fall into the medium or expanded window size class in both portrait and landscape." "Wide (4:3) inner displays... Reach the expanded window size class in landscape orientation and pair with a 10:16 (16:10 landscape) outer display when folded." — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Navigation: "In compact windows... a navigation bar at the bottom of the window. In an expanded window... a navigation rail alongside the app is usually a better choice since the navigation controls are easier to reach while holding the left and right sides of the device." `NavigationSuiteScaffold` defaults: "Navigation bar if the width or height is compact or if the device is in tabletop posture; Navigation rail for everything else". It can be overridden, for example to use a permanent drawer at ≥ expanded. — [Build adaptive navigation](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)
- Tier 2 requires "Navigation rails replace navigation bars" on large screens, and drawers be "updated to expanded navigation rails". — [Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Material 3 Expressive coverage reports that the rail is for "medium, expanded, large, or extra-large window sizes" and that the "navigation drawer is being deprecated in the Material 3 expressive update". This is secondary coverage of m3.material.io. — [9to5Google](https://9to5google.com/?p=672452)
- **Conflict**: one community summary of the m3.material.io breakpoint pages says Material lists a navigation bar for both compact and medium, with a rail from expanded. Google's Compose default (`NavigationSuiteScaffold`) shows a rail at medium. — [hamen/material-3-skill summary](https://github.com/hamen/material-3-skill/blob/master/skills/material-3/references/layout-and-responsive.md) vs [Build adaptive navigation](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)
- **Canonical layouts** (from [Canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts)):
  - **List-detail**: two panes side by side at expanded width; list *or* detail at medium and compact width. When narrowing from two panes, keep the detail visible. When widening from detail-only, show both panes and mark the item as selected in the list. When widening from list-only, show the list plus a placeholder detail. On small windows, Back from the detail returns to the list.
  - **Feed**: a grid that adapts column count. Example: `GridCells.Adaptive(minSize = 180.dp)`.
  - **Supporting pane**: the main pane takes about two thirds. Compact: supporting content below the main content or in a bottom sheet. Medium: 50/50. Expanded: 70/30.
- **Margins, spacers and panes on m3.material.io** (JS-rendered, so I could not fetch the pages directly; values come from search excerpts of those pages):
  - Large and extra-large use 24dp margins and a 24dp spacer between panes, with a drag handle when panes are resizable.
  - The fixed pane in a fixed-plus-flexible layout is 412dp by default at large and extra-large.
  - Side sheets default to a 400dp maximum width.
  - "Window size classes" were renamed "breakpoints" and "responsive layout" renamed "adaptive design" in the May 2026 update.
  — [M3 Breakpoints: large & extra-large](https://m3.material.io/foundations/layout/breakpoints/large-extra-large); [M3 Layout overview](https://m3.material.io/foundations/layout/layout-overview)
- Secondary summaries (unverified against m3.material.io) say margins are 16dp at compact and 24dp from medium up. Pane counts: 1 at compact; 1 at medium (2 possible); 2 at expanded and large; up to 3 at extra-large. A fixed pane of 360dp at expanded and 412dp at large and above. — [hamen/material-3-skill summary](https://github.com/hamen/material-3-skill/blob/master/skills/material-3/references/layout-and-responsive.md); [SAP Fiori for Android canonical layouts](https://www.sap.com/design-system/fiori-design-android/v26-4/foundations/adaptive-layout/canonical-layouts)
- Material codelab: body text max line length is about 60 characters; the large-screen layout uses a 12-column grid; margins "can be fixed or scale between sizes". — [Design an adaptive layout with Material Design codelab](https://developer.android.com/codelabs/adaptive-material-guidance)
- Max widths: Google's Android 17 guidance caps stretched components with `Modifier.widthIn(max = …)`, using 300dp as an example for a form column. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- **Bottom sheets**:
  - Material says bottom sheets should scale on larger screens by setting a maximum width, switching to a floating sheet, or switching to a side sheet. It advises against full-width bottom sheets in large layouts.
  - Sheets that hold a set of actions can become a context menu.
  - Compose's `BottomSheetDefaults.SheetMaxWidth` (used by `ModalBottomSheet` and `BottomSheetScaffold`) and the MDC Android bottom sheet both default to a **640dp** maximum width.
  — [Compose `SheetMaxWidth` reference](https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-bottom-sheet-defaults/-sheet-max-width.html); [Material bottom sheets](https://material.io/components/sheets-bottom); [Tier 2 UI_Secondary_Elements](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Dialogs and modals: "Small edit menus or modals don't cover the entire screen and maintain context for the user as much as possible." On foldables, "Position dialog boxes and pop‑up menus so they don't overlay the fold." — [Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2); [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- New Compose layout tools from I/O 2026: Grid and FlexBox, Navigation 3 1.1 Scene Decorators, and an experimental MediaQuery API that exposes window size and pointer precision. — [Android Developers Blog, 19 May 2026](https://developer.android.com/blog/posts/adaptive-development-for-the-expanding-android-ecosystem)

### Inferences
- Mapping to the app's screens, using Google's patterns:
  - **History** (calendar, entry list, entry detail) is a textbook list-detail: two panes at ≥ 840dp, one at a time below that.
  - **Today** (stat cards, week and month charts, timeline) fits a feed or adaptive grid: 1 column at compact, 2 at medium, a 2–3 column grid or main-plus-supporting pane at expanded.
  - **Settings** can use list-detail at expanded.
  - The **bottom tab bar** becomes a navigation rail at ≥ 600dp (Compose default) or at ≥ 840dp (stricter Material reading). The centre + button maps naturally to the FAB slot at the top of the rail.
  - **Entry forms and bottom sheets** need a max width (≤ 640dp, or a centred dialog or side sheet) instead of full-width sheets on the inner display.
- Because large and extra-large mainly target desktop and connected displays, a foldable inner screen (about 600–1000dp wide) will almost always be medium or expanded. Designing compact, medium and expanded covers the foldable case.
- In React Native the same breakpoints can be applied from `useWindowDimensions()` widths in dp. React Native reports width in dp, so the values compare directly with Google's thresholds.

### Gaps
- I could not render m3.material.io directly because the site is JS-only. Per-class margins (16/24dp), the 360dp fixed pane at expanded, and the bar-vs-rail recommendation at *medium* are from search excerpts and community summaries, not verified page text.
- I did not find an official Material "max content width" figure for single-column body content beyond the 60-character line-length guidance and component caps.

## 4. Foldable postures, hinge APIs and app continuity

### Takeaway
Jetpack WindowManager exposes `FoldingFeature` in `WindowLayoutInfo`. Its properties are `state` (FLAT / HALF_OPENED), `orientation` (HORIZONTAL / VERTICAL), `occlusionType` (NONE / FULL), `isSeparating` and `bounds`. Tabletop posture is HALF_OPENED + HORIZONTAL; book posture is HALF_OPENED + VERTICAL. Google says not to put controls, dialogs or text across a separating fold, and to split content into the two halves when half-opened. Folding and unfolding is a configuration change that must preserve state (Tier 3 `Config_Changes`). The folded and unfolded layouts should show the same content, with the inner screen adding complementary content.

### Cited Findings
- `FoldingFeature` (a `DisplayFeature`) properties: `state` FLAT or HALF_OPENED; `orientation` HORIZONTAL or VERTICAL; `occlusionType` NONE or FULL, meaning whether the hinge conceals part of the display; `isSeparating`, meaning two logical display areas. "FoldingFeature does not expose the angle." — [Make your app fold aware](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware)
- "A foldable device that is HALF_OPENED always reports isSeparating as true... isSeparating is always true on a dual‑screen device when the application spans both screens." `bounds` gives the hinge rectangle for positioning content. — [Make your app fold aware](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware)
- Tabletop = `HALF_OPENED && orientation == HORIZONTAL`; book = `HALF_OPENED && orientation == VERTICAL`. Compose also offers `currentWindowAdaptiveInfoV2().windowPosture.isTabletop` and `collectFoldingFeaturesAsState()`, which collects from `WindowInfoTracker`. — [Make your app fold aware](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware)
- "Don't place UI controls too close to a fold or hinge when isSeparating is true because the controls can be difficult to reach. Use occlusionType to decide whether to place content within the folding feature bounds." On two-screen devices, use tabletop and book layouts even when the state is FLAT. — [Make your app fold aware](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware)
- "UI controls near the fold can be difficult for users to access, and text overlaying the fold can be hard to read (or unreadable if occlusionType is FULL). Position dialog boxes and pop‑up menus so they don't overlay the fold... Split content into two areas when the device is half opened—top and bottom in tabletop posture, left and right in book posture." — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- On dual-screen devices with a physical hinge, occlusionType is FULL and no content is viewable in the hinge area. — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Foldable display modes: **rear display mode** (use the outer screen while unfolded, for example rear-camera selfie) and **dual-screen mode** (content on inner and outer at once). — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- App continuity: "An app stops and restarts as it transitions from one screen to another when a device folds or unfolds. To maintain continuity for the user, the app must preserve and restore its state seamlessly." Layouts should complement each other: the unfolded screen shows the same content plus complementary content. — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Folded, the device behaves like a phone (single column plus bottom bar). Unfolded in landscape it behaves like a tablet (two panes plus a navigation rail). — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Tier 3 requires state to survive "folding and unfolding": scroll position, typed text and keyboard state. — [Tier 3](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-3)
- "By default, these configuration changes destroy and recreate your activity... scroll positions are reset to the top, half-filled forms are wiped clean, and navigation history is lost." With Compose you can opt out of recreation and recompose instead. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Foldables support split-screen, and some support desktop windowing. — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Samsung's foldable testing areas: optimised UI layout, App Continuity, Multi-Active Window, Flex Mode (Samsung's name for the half-folded posture). — [Samsung Foldables and Large Screens](https://developer.samsung.com/foldables-and-largescreens)
- Recent devices that Google says expand posture and size variety: Pixel 10 Pro Fold (Sep 2025), Pixel 11 Pro Fold (Aug 2026), and Samsung's new foldables at Galaxy Unpacked (22 Jul 2026). — [Compose Adaptive Layouts 1.2 beta blog](https://developer.android.com/blog/posts/unfold-new-possibilities-with-compose-adaptive-layouts); [Made by Google 2026 blog](https://developer.android.com/blog/posts/enhance-your-app-for-the-new-pixel-lineup-unveiled-at-made-by-google); [Samsung Galaxy devices blog](https://developer.android.com/blog/posts/optimize-your-apps-for-the-next-generation-of-samsung-galaxy-devices)

### Inferences
- With the app's `configChanges`, folding is not an activity restart, so most continuity comes for free. The work is in re-laying out from the new dimensions and keeping the user on the same entry, scroll position and form.
- On a book-style foldable held flat, the inner screen usually has a non-separating vertical fold (`isSeparating=false` when FLAT). A two-pane split such as History list | detail naturally puts the divider near the fold. Panes do not have to align to it when FLAT, but must avoid putting controls on it when HALF_OPENED.
- Tabletop posture is a niche case for a diary. The relevant rule is that `NavigationSuiteScaffold` switches back to a bottom bar in tabletop posture, and modals and sheets should not straddle the horizontal fold.
- React Native has no built-in `FoldingFeature` access. A native module, or a community package wrapping `androidx.window` WindowInfoTracker, would be needed for posture awareness. Window-size-based layouts work without it.

### Gaps
- I did not fetch Samsung's current Flex Mode / cover-screen guidance for the Fold7 era. Samsung's "Continue apps on cover screen" setting behaviour is not covered by a primary source here.
- No primary source states what Pixel's fold-to-cover-screen continuity defaults are in 2026 (for example, whether apps continue on the cover screen or are suspended by default).

## 5. Testing tools and commands

### Takeaway
Use the Android Studio emulator profiles **Foldable (1:1 inner display)**, **Foldable (4:3 inner display)**, **Pixel Fold**, **Medium Tablet** and **Desktop (Preview)**, plus the **Resizable emulator**. Drive them with `adb emu fold/unfold/rotate/posture/resize-display`. Use `adb shell wm size` / `wm density` for quick overrides. Use Samsung Remote Test Lab for real Galaxy Z Fold hardware.

### Cited Findings
- Emulator profiles and reference sizes (Googlebook 160 ppi; 802x802dp 1:1 foldable; 1024x768dp 4:3 foldable; 1024x640dp 8" tablet; 1280x800dp 10.5" tablet; 1600x900dp 13" Chromebook). Desktop (Preview) needs Android Studio Canary. — [Adaptive app quality](https://developer.android.com/docs/quality-guidelines/large-screen-app-quality)
- Android CLI profile names are `foldable_1_1` and `foldable_4_3`, and they match the Play Store screenshot specifications. — [Learn about foldables](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/learn-about-foldables)
- Emulator console commands (blog of 31 Aug 2026):
  - `adb emu resize-display` lists presets; `adb emu resize-display 1` applies one (0: phone, 1: unfolded, 2: tablet).
  - `adb emu fold` / `adb emu unfold`.
  - `adb emu rotate` turns 90° clockwise.
  - `adb emu posture` lists postures; `adb emu posture 2` sets tabletop (half-opened). Pixel Fold and Resizable AVDs support postures 1–3 only.
  - `adb -s <serial> emu …` targets one emulator.
  — [Android Developers Blog, 31 Aug 2026](https://android-developers.googleblog.com/2026/08/emulator-adaptive.html)
- `adb shell wm size WxH` / `wm size reset` and `adb shell wm density N` / `wm density reset` override the logical display. Samsung's DeX guide uses `wm density 160` with `wm size 1080x1920`. One secondary source warns that these trigger a configuration change. — [Samsung DeX testing guide](https://developer.samsung.com/SamsungDeX/testing.html); [tldr wm](https://tldr.dendron.so/notes/android.wm.html)
- Compat-flag testing: `adb shell am compat enable UNIVERSAL_RESIZABLE_BY_DEFAULT <package>` simulates the Android 16 behaviour. The general form `adb shell am compat enable <OVERRIDE> <package>` works for aspect-ratio overrides. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16); [Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)
- Automated tooling:
  - Espresso Device (alpha) for `setTabletopMode()`, `setDisplaySize(...)`, and `@RequiresDeviceMode(TABLETOP|BOOK)` / `@RequiresDisplay`.
  - Window-testing `FoldingFeature()` / `TestWindowLayoutInfo()`.
  - Compose `DeviceConfigurationOverride.ForcedSize`.
  - Robolectric qualifiers.
  - Gradle-managed devices (for example `device = "Pixel Fold"`).
  - Firebase Test Lab for real foldables and tablets.
  — [Testing tools for different screens](https://developer.android.com/training/testing/different-screens/tools)
- The Compose UI Check tool audits layouts for adaptive issues. — [Android Developers Blog, 13 Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17)
- Samsung Remote Test Lab gives free cloud access to real Samsung devices, including foldables and new releases, with a Samsung account. — [Samsung Remote Test Lab](https://developer.samsung.com/support); [Samsung App Testing](https://developer.samsung.com/resources/app-testing)
- Tier 3 test procedure (`T-Config_State`): on each screen, scroll, type into several fields, then rotate, fold and unfold, and resize in multi-window. Verify scroll position and text are retained. On desktop, also minimise and restore, and maximise and restore. — [Tier 3](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-3)

### Inferences
- A minimal pass for this app:
  1. On the Foldable 4:3 emulator, start folded (cover screen, portrait-locked compact).
  2. Open an entry form, type, then `adb emu unfold`. Check the form persists and the inner layout switches.
  3. `adb emu rotate`, then confirm the sheet and modal max width and a reachable Save button.
  4. Enter split-screen and resize through 600 and 840dp.
  5. `adb emu posture 2` to check nothing straddles the fold.
  6. Repeat on the Foldable 1:1 and Medium Tablet profiles.
- Because the activity is not recreated, also test with "Don't keep activities" or process death to cover the case where the system kills the app in the background.

### Gaps
- I did not find an official page listing the 2026 AVD skins by name for Pixel 9 Pro Fold, Pixel 10 Pro Fold or Galaxy Z Fold7. Google's docs now point to generic "Foldable (1:1)" and "Foldable (4:3)" profiles plus "Pixel Fold".
- I did not confirm current Samsung Remote Test Lab credit or session limits, or which Fold models are available, in 2026.
