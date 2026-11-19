# Foldable and large-screen support in React Native 0.86 / Expo SDK 57 with expo-router (as of 19 November 2026)

> Scope: engineering facts for adding adaptive layouts, and optionally fold-posture awareness, to Eleva Diary (`/Users/rodrigo.barona/Documents/GitHub/pee-diary`). Research done 2026-11-19 with web search and fetch. Local code was read only, not changed.
>
> **Correction to the brief (read this first).** Expo SDK 57 / RN 0.86 is no longer the newest release. **Expo SDK 58 shipped on 15 October 2026 and moves React Native from 0.86 to 0.88** — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58). Several of the most relevant pieces (`expo-hinge`, stable `expo-router/native-tabs`, `preferredPlacement="sidebar"`, iOS 27 resizable-app handling, iPhone Duo support) are **SDK 58 only**. Each finding below is labelled **[SDK 57]**, **[SDK 58+]** or **[platform]**.
>
> **Local facts checked in the repo (2026-11-19):**
> - package.json: `expo ~57.0.33`, `react-native 0.86.3`, `expo-router ~57.0.31`, `react-native-screens ~4.26.2`, `react-native-safe-area-context ~5.7.0`, `nativewind 5.0.0-rc.1`, `react-native-css 3.1.0-rc.1`, `tailwindcss 4.1.12`, `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`.
> - app.json: `orientation: "portrait"`, `ios.supportsTablet: false`, no `requireFullScreen`.
> - `android/app/src/main/AndroidManifest.xml` MainActivity: `configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|assetsPaths|locale|layoutDirection"`, `screenOrientation="portrait"`, `launchMode="singleTask"`, `windowSoftInputMode="adjustResize"`.
> - **The brief says "native tabs", but the tabs are not native.** `app/(tabs)/_layout.tsx` uses JS `Tabs` / `BottomTabBar` from `expo-router/tabs`, with a custom iOS "+" slot and a hand-built Material 3 indicator. No file imports `NativeTabs`. This matters for the rail/sidebar question below.
> - Width-dependent code: `app/(tabs)/_layout.tsx:110` (`width`), `components/diary/calendar-header.tsx:85` (`windowWidth`), `app/(onboarding)/welcome.tsx:222,442` (`windowHeight`; `pageWidth` for horizontal paging). Charts (`weekly-chart`, `monthly-chart`, `fluid-balance-chart`) and `timeline-entry` / `time-picker` read only `fontScale`.
> - No NativeWind responsive variants (`sm:`/`md:`/`lg:`) are used. The `lg:` hits in `components/ui/button.tsx` are CVA size keys, not media variants. `global.css` defines no custom breakpoints.
> - Sheets: `presentation: "formSheet"` with `sheetAllowedDetents` (`"fitToContents"` on most; `[1.0]` on iOS for export), `sheetGrabberVisible` on iOS, and `sheetCornerRadius: 28` on Android (`app/_layout.tsx:51-60,194-220`). Modals use `presentation: "modal"`.

## Expo config: orientation, supportsTablet/requireFullScreen, expo-screen-orientation, Android 16 large-screen rules, doctor/EAS warnings

### Takeaway
On Android, the `"portrait"` lock is already ignored on any display at least 600dp wide (including the unfolded inner screen of book-style foldables), because the app targets SDK 36. Only a temporary manifest property opts out, and it stops working at API 37. Expo's app config has no field for this. On iOS, `supportsTablet: false` keeps the app off iPad as a native app, but iOS 27 (handled from SDK 58) makes iPhone apps resizable and turns orientation locks into preferences. So in either case the realistic plan is a layout that adapts to any window size and orientation, not one that relies on locks.

### Cited Findings
- **`orientation`** (top-level app config): "Locks your app to a specific orientation with portrait or landscape. Defaults to no lock." Values: `default`, `portrait`, `landscape`. The page lists no per-platform keys. — [Expo app config reference (latest)](https://docs.expo.dev/versions/latest/config/app/)
- **`ios.supportsTablet`**: "Whether your standalone iOS app supports tablet screen sizes. Defaults to `false`." — [Expo app config](https://docs.expo.dev/versions/latest/config/app/)
- **`ios.isTabletOnly`**: when true, the app "does not support handsets, and only supports tablets." — [Expo app config](https://docs.expo.dev/versions/latest/config/app/)
- **`ios.requireFullScreen`**: "If true, indicates that your standalone iOS app does not support Slide Over and Split View on iPad. Defaults to `false`." — [Expo app config](https://docs.expo.dev/versions/latest/config/app/)
- The Expo app config page has **no Android property** for large screens, `resizeableActivity`, or Android 16 orientation behaviour. — [Expo app config](https://docs.expo.dev/versions/latest/config/app/)
- **expo-screen-orientation**:
  - The config plugin sets properties "that cannot be set at runtime". `initialOrientation` is iOS-only.
  - To lock orientation on iPad you must set `ios.requireFullScreen: true`.
  - On **iOS 27+**, `requireFullScreen` "no longer opts your app out of being resized", and for resizable apps "lockAsync may have no effect. The system can refuse the request", because "the system treats a supported orientation as a preference rather than a requirement."
  - The page says nothing about Android 16.
  - — [expo-screen-orientation docs (latest)](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)
- **Android 16 (API 36) behaviour change, official text:**
  - For apps targeting API 36, "orientation, resizability, and aspect ratio restrictions no longer apply on displays with smallest width >= 600dp. Apps fill the entire display window … and pillarboxing isn't used."
  - Ignored on large screens in full-screen and multi-window modes: `screenOrientation`, `resizableActivity`, `minAspectRatio`, `maxAspectRatio`, `setRequestedOrientation()`, `getRequestedOrientation()`. Ignored values include `portrait`, `sensorPortrait`, `userPortrait`, and the landscape equivalents.
  - Exceptions: games (`android:appCategory`); users who explicitly opt in to the app's default in the device's aspect-ratio settings; screens below `sw600dp`.
  - Temporary opt-out: `<property android:name="android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY" android:value="true" />` on `<activity>` or `<application>`. It "won't apply when targeting API level 37."
  - Test flag: `UNIVERSAL_RESIZABLE_BY_DEFAULT`.
  - The page also warns of "stretched layouts and off-screen animations".
  - — [Android 16 behavior changes (targetSdk 36)](https://developer.android.com/about/versions/16/behavior-changes-16)
- Secondary sources: a community write-up says Android 17 removes the opt-out entirely. — [DEV Community article](https://dev.to/mbilalkhan192003/android-is-taking-away-orientation-locks-on-large-screens-heres-what-developers-need-to-know-3ob0); [Wikipedia: Android 17](https://en.wikipedia.org/wiki/Android_17). (Secondary sources. The primary Google text above only says the opt-out stops working when targeting API 37.)
- A third-party article (Rork Lab) says app.json gives no way to set the opt-out property in Expo, and that the lock lives both in app.json and in the prebuilt manifest. — [rorklab.net](https://rorklab.net/en/articles/app-dev/android-16-large-screen-orientation-override-expo-manifest-property). (Fetching the full article failed, so only the search snippet was seen.)
- **Expo prebuild change for foldables:** Expo PR #42150 "add smallestScreenSize to android:configChanges to prevent activity recreation when screen is folded".
  - Merged 14 January 2026 by Ubax.
  - Touches `@expo/config-plugins` `withAndroidBaseMods` and the bare template.
  - Rationale: on Galaxy Fold 6, fold/unfold "triggers an activity recreation", which caused an expo-router "linking configured in multiple places" error and state loss.
  - A maintainer (vonovak) said in expo/expo#42294 that this changed foldable behaviour in **SDK 55**.
  - — [expo/expo PR #42150](https://github.com/expo/expo/pull/42150); [expo/expo#42294](https://github.com/expo/expo/issues/42294)
  - The local manifest already contains `smallestScreenSize`, which matches this change.
- **SDK 58 (iOS 27):**
  - SDK 58 "makes iPhone apps resizable, and apps built with the iOS 27 SDK get both automatically."
  - "`requireFullScreen` no longer opts your app out of resizing."
  - "`ScreenOrientation.lockAsync` may have no effect while the app is resizable."
  - "Expo packages no longer read geometry from `UIScreen.main`."
  - — [Expo SDK 58 changelog, 15 Oct 2026](https://expo.dev/changelog/sdk-58)
  - On iPhone Duo, "apps can lock to portrait or landscape if they fill the screen as the pose changes". — [Expo blog: Supporting iPhone Duo, 23 Oct 2026](https://expo.dev/blog/supporting-iphone-duo)

### Inferences
- **Android, Eleva today [platform, SDK 57]:**
  - On a book-style foldable's inner display, which is at least sw600dp on current Pixel Fold / Galaxy Z Fold inner screens (exact dp per model unverified), `screenOrientation="portrait"` is ignored. The app will run landscape when the user holds the unfolded device in landscape, and in arbitrary sizes in split-screen or desktop windowing.
  - On the cover screen (below sw600dp) the portrait lock still applies.
  - So the app needs to work in landscape on the inner screen whether or not you change app.json.
- **Possible stopgap [untested]:** add `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY` with a small local config plugin (the repo already has `./plugins/with-*` plugins) to get letterboxed compat mode on Android 16 while the adaptive work is under way. It disappears at targetSdk 37, and Google Play will eventually require targetSdk 37.
- **Recommended direction:** switch to `orientation: "default"` once layouts adapt. On Android this removes `screenOrientation`, which is ignored on large screens anyway, and lets phones rotate. Keeping `"portrait"` still constrains phones and cover screens, which may be what the product wants. **Untested:** the exact manifest/Info.plist values prebuild writes for `"default"` were not verified in this research.
- **iOS:**
  - Keeping `supportsTablet: false` means iPads run the iPhone app in compatibility mode, so no iPad layout work is needed.
  - Setting it to `true` brings iPad multitasking: Split View and Stage Manager arbitrary widths. You must handle compact-to-regular width changes, or set `requireFullScreen: true`, which per the SDK 58 changelog has no effect on iOS 27.
  - On SDK 58 / iOS 27 even iPhone apps become resizable, so adaptive layout becomes unavoidable on iOS too.

### Gaps
- No Expo doc, changelog or expo-doctor/EAS rule was found that warns about `orientation: "portrait"` with targetSdk 36 or adds the opt-out property. No expo-doctor check related to large screens was found.
- The exact `UISupportedInterfaceOrientations` / `~ipad` and Android `screenOrientation` values prebuild writes for each `orientation` value were not confirmed from primary docs.
- Whether Google Play Console flags portrait-locked apps for large-screen quality was not researched; it belongs to another researcher's scope.

## useWindowDimensions reliability on fold/unfold, multi-window, iPad split view; RN bugs; safe-area behaviour

### Takeaway
`useWindowDimensions` is documented to update on any window size change. There are open or abandoned reports of stale values on Android foldables: RN 0.79 on Android 15, and Expo SDK 54 with RN 0.81. The main cause was activity recreation, which Eleva already avoids with `smallestScreenSize` in configChanges. No fix landed in RN 0.80–0.86 that I could cite. Verify on a Pixel Fold emulator. As defensive fallbacks, use `useSafeAreaFrame()` or measure a root `onLayout`.

### Cited Findings
- The official docs say `useWindowDimensions` "automatically updates all of its values when screen size or font scale changes". — [reactnative.dev useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)
- **react/react-native#52952**, "useWindowDimensions not working on android15 foldable device":
  - Opened 1 Aug 2025 on RN 0.79.4, New Architecture and Hermes.
  - The hook does not update on fold/unfold on Android 15. The reporter says it works on Android 14 and 16.
  - Root cause not found and no fix. Marked stale 18 Aug 2026.
  - Workaround: `useSafeAreaFrame` on Android 15+.
  - — [GitHub issue #52952](https://github.com/react/react-native/issues/52952)
- **expo/expo#42294**, "useWindowDimensions not working properly on foldable devices":
  - Opened 19 Jan 2026 on expo ~54.0.31 / RN 0.81.5, bare workflow. Width and height stay at launch values until restart. A bare RN app did not reproduce it.
  - Labelled "Upstream: React Native" on 9 Jun 2026. Closed 29 Sep 2026 for no reply.
  - It links PR #42150 (configChanges) as the SDK 55 behaviour change.
  - With `"orientation": "default"`, fold/unfold logged a linking-configuration warning. With `"portrait"` it did not, until the user forced full-screen aspect ratio.
  - — [expo/expo#42294](https://github.com/expo/expo/issues/42294)
- **react/react-native#41918:** on a Galaxy Fold 5 with a translucent status bar, `useWindowDimensions().height` includes the status bar when folded but not when unfolded. A commenter worked around it by measuring a root View's layout. — [GitHub issue #41918](https://github.com/react/react-native/issues/41918)
- Older background: #29323 (RN 0.63) reported stale `Dimensions.get('window')` after rotation on Android; closed and locked. — [GitHub issue #29323](https://github.com/react/react-native/issues/29323)
- The SDK 58 iPhone Duo guide says to "Read `useWindowDimensions` at render time, since window size changes with folding and Split View". Its Split View example window is 469pt wide. — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
- **Safe area:**
  - SDK 58 says "you may need to add `<SafeAreaView>` in more places, such as inside scrollviews, to handle horizontal insets for iPhone Duo". — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58)
  - The iPhone Duo vertical rail adds an 84pt left or right inset.
  - Pad content containers, not the root view.
  - Watch absolutely positioned elements (`insets.right + 16`) and horizontal scroll rows.
  - Don't add a fixed tab-bar height when `insets.bottom` already includes it.
  - — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
- Android 16 targetSdk 36: edge-to-edge opt-out (`windowOptOutEdgeToEdgeEnforcement`) is disabled, so insets come from the system on every window size. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)

### Inferences
- Because Eleva's MainActivity handles `orientation|screenSize|smallestScreenSize|screenLayout`, fold/unfold should be a configuration change delivered to the existing activity, not a recreation. RN then emits a dimensions-change event. The Android 15 report (#52952) is the remaining risk.
- **Untested:** whether RN 0.86.3 still shows #52952 on Android 15 fold/unfold. Test on a Pixel Fold API 35 AVD and an API 36 AVD.
- Recommended pattern:
  - Read size from one place, either a `useWindowClass()` hook or a root `onLayout` stored in context.
  - Use `useSafeAreaFrame()` from react-native-safe-area-context as a cross-check. On Android it reflects the root view frame, which is what the Android 15 workaround in #52952 relies on.
  - Don't cache dimensions in module scope or in Zustand.
- `welcome.tsx:442` uses `pageWidth = windowWidth` for horizontal paging. On fold/unfold, a horizontal pager keeps its old `contentOffset`. Re-scroll to `index * newWidth` on width change. Issue Haomari/Ligmus#2 is a real-world example of "horizontal paging break[ing] when unfolding". — [Ligmus issue #2](https://github.com/Haomari/Ligmus/issues/2) (seen only as a search result title)

### Gaps
- I did not find a specific RN 0.80–0.86 changelog entry fixing Dimensions on foldables. The RN release blogs for 0.80–0.88 were not fetched.
- react-native-safe-area-context 5.7.x behaviour on fold (inset update timing, display cutout on the inner screen) is not documented in anything I fetched.

## expo-router / react-native-screens large-screen patterns: split view, tabs to sidebar/rail, formSheet/modal on large windows

### Takeaway
List-detail split view in expo-router is `expo-router/unstable-split-view`. It is **alpha, iOS-only** (UISplitViewController) and falls back to `Slot` on Android. So it gives Android foldables nothing, and an Android two-pane layout has to be built in JS inside a screen.

iOS sidebar adaptivity comes from native tabs (`preferredPlacement="sidebar"`, SDK 58, iOS 27). I found no documentation that expo-router NativeTabs turns into a Material navigation rail on Android. Eleva uses JS tabs anyway, so any rail or sidebar is custom work.

formSheet on large iOS windows is a centred, narrow sheet (system behaviour). Known react-native-screens bugs: cropped content on tablets, and zero-size nested stacks.

### Cited Findings
- **SplitView status and platforms:**
  - "alpha API available on iOS only in Expo SDK 55 and later … subject to breaking changes and is not ready for production usage yet."
  - On other platforms "the SplitView component automatically falls back to rendering as a standard Slot navigator."
  - On iPhone, columns collapse to one view with the system back button.
  - Recommended expo-router version in the v57 docs: ~57.0.31, which matches Eleva.
  - — [Expo docs v57: Split view](https://docs.expo.dev/versions/v57.0.0/sdk/router/split-view.md)
- **SplitView API (v57 docs):**
  - Imported from `expo-router/unstable-split-view`. The root `SplitView` takes `SplitHostProps`, including `topColumnForCollapsing` (`primary|supplementary|secondary`) and `showInspector`, plus a `ref.show()` (`SplitHostCommands`).
  - `ref.show()` needs react-native-screens ≥4.24.0. Eleva has 4.26.2.
  - `SplitView.Column` adds up to two columns before the main content.
  - `SplitView.Inspector` is a trailing column, iOS 26+.
  - Constraints: only one SplitView in the hierarchy; it cannot be inside another navigator except `Slot` (root layout only); only Column/Inspector children are allowed.
  - Limitations: column header can't be customised; minimal API; no granular back control.
  - — [Expo docs v57: Split view](https://docs.expo.dev/versions/v57.0.0/sdk/router/split-view.md)
- **SplitView history and churn:**
  - Introduced as "experimental support for the native Apple `UISplitViewController`" in Expo Router v55. — [Expo blog: Expo Router v55, 2 Mar 2026](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web)
  - Still "experimental in SDK 58". — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
  - An upstream react-native-screens PR proposes renaming to `Split.Host`/`Split.Column`/`Split.Inspector`. — [react-native-screens PR #3487](https://github.com/software-mansion/react-native-screens/pull/3487)
  - expo PRs fix a crash with react-native-screens 5 Split stacks and add `Split.Stack`. — [expo/expo PR #52018](https://github.com/expo/expo/pull/52018)
  - Another PR adds `useSplitView`/`splitViewColumnName` and makes push inside SplitView replace the route. — [expo/expo PR #52506](https://github.com/expo/expo/pull/52506)
  - These PRs were seen only as search-result summaries; their merge status was not verified.
  - A community project parked its SplitView spike while waiting for the Split redesign and "Stack v5 as a column", which it expected around SDK 59. — [decepulis/dainorelis#77](https://github.com/decepulis/dainorelis/issues/77) (third party, search snippet only)
- **Native tabs:**
  - Import path is `expo-router/unstable-native-tabs` for SDK 54–57 and `expo-router/native-tabs` for SDK 58+.
  - `preferredPlacement="sidebar"` on `NativeTabs` is SDK 58+, needs Xcode 27, and only works on iOS 27+.
  - The docs say the tab bar is "sometimes being on top of the screen when rendering on iPad".
  - Android limits: max 5 tabs (Material); tab bar height can't be measured; no nested native tabs; `tabBarRespectsIMEInsets` (Android 11+).
  - — [Expo docs: Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
  - SDK 58 marks native tabs stable. `preferredPlacement` selects "the sidebar or the tab bar when only one of them can show" (iOS). — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58); [expo-router CHANGELOG](https://github.com/expo/expo/blob/main/packages/expo-router/CHANGELOG.md)
  - Per the iPhone Duo guide, `preferredPlacement` accepts `'sidebar' | 'tabBar' | 'automatic'`, and custom JS `<TabList>` in the vertical rail "is not supported". — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
- **Android navigation rail:**
  - No Expo doc found that says NativeTabs renders a Material navigation rail on large Android windows.
  - Material guidance reserves the rail for "medium, expanded, large, or extra-large window sizes". — [SAP Fiori for Android, M3 navigation rail usage](https://www.sap.com/design-system/fiori-design-android/v25-8/components/m3-standard-components/navigation-rail/usage)
- **formSheet / modal on large windows:**
  - RN's Modal docs describe `formSheet` as a "narrow-width view centered (only on larger devices)". — [reactnative.dev Modal](https://reactnative.dev/docs/modal)
  - react-native-screens #2770: on iPad, formSheet content is cropped about 80% of the time (v4.9.2, New Arch). — [rn-screens #2770](https://github.com/software-mansion/react-native-screens/issues/2770)
  - react-native-screens #2522: a stack navigator inside a formSheet gets zero size. A fixed-size wrapper works, `flex:1` does not. The maintainers tie it to async shadow-node state updates, fixable with RN ≥0.82 synchronous state updates. — [rn-screens #2522](https://github.com/software-mansion/react-native-screens/issues/2522)
  - react-native-screens #3235: form sheets "too small" and not bottom-anchored on iOS 26 (Expo 54). Closed as native behaviour. — [rn-screens #3235](https://github.com/software-mansion/react-native-screens/issues/3235)
  - gorhom bottom-sheet maintainers discussed a max-width prop for tablets. — [gorhom discussion #234](https://github.com/gorhom/react-native-bottom-sheet/discussions/234)
- **SDK 58 extras:**
  - `SceneGeometry.anchorPopover` anchors popovers "on any regular-width display".
  - Expo UI `NavigationSplitView` "adds two- and three-column layouts".
  - — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58)
  - A third-party JS-only `expo-split-view` (0.0.1-beta) also exists. — [Inocentum-Technologies/expo-split-view](https://github.com/Inocentum-Technologies/expo-split-view)

### Inferences
- For Eleva, native SplitView is not worth it.
  - It's alpha and iOS-only, and the app doesn't ship on iPad (`supportsTablet: false`).
  - Android foldables, the main target, get only a `Slot`.
  - A **JS two-pane inside the History screen** is the portable approach, for example a calendar/list on the left and the selected day's timeline on the right when width ≥600dp. It renders a route's component inline rather than pushing.
- **Android sheets [untested]:**
  - react-native-screens on Android renders formSheet as a bottom sheet. On a ~840dp-wide unfolded inner display it will likely span full width unless capped.
  - Material 3 guidance for bottom sheets on large screens is a max width of about 640dp. That figure is not sourced here; confirm with the design researcher.
  - Plan to constrain sheet content with `maxWidth` + `alignSelf:'center'` and test `fitToContents` after fold/unfold.
- `fitToContents` detents are computed from content layout. A width change on fold/unfold changes text wrapping and height, so test that the detent re-resolves while the sheet is open. **Untested.**
- Because Eleva uses JS tabs, adding a rail on wide Android windows is straightforward in JS: render a custom `tabBar` that becomes a vertical `View` on the left when `widthClass !== 'compact'`, and switch the Tabs container to a row layout. Getting the system iPad/iOS 27 sidebar requires migrating to `NativeTabs` (SDK 58 import path) and losing the custom "+" slot, which NativeTabs can't host the same way. **Untested.**

### Gaps
- I couldn't confirm from primary docs how react-native-screens 4.26 formSheet sizes on Android large windows: max width, centring, or a side sheet.
- I couldn't confirm whether react-native-screens' native bottom tabs (TabsHost) on Android switch to `NavigationRailView` automatically.
- Whether `presentation: "modal"` on Android large screens is full-window or dialog-like was not documented in sources found.

## Fold posture / hinge libraries for RN; maintenance in 2026; local Expo module sketch

### Takeaway
The healthiest option is now first-party: **`expo-hinge` (SDK 58+)**. It gives hinge angle and status on Android 11+ (FoldingFeature for status, hinge-angle sensor for angle) and on iOS 27.1. It does **not** expose fold bounds or orientation. Microsoft's dual-screen packages are legacy.

Several young community libraries (Nitro or TurboModule) expose FoldingFeature bounds. Their versions and adoption are unverified.

For layout around a hinge on SDK 57, a ~100-line local Expo module wrapping `WindowInfoTracker` is a reasonable fallback. Eleva's diary use case probably doesn't need posture at all.

### Cited Findings
- **expo-hinge:**
  - API: `useHinge()`, `getHinge()`, `isAvailable()`, `addHingeListener()`, plus `useAnimatedHinge()` / `addHingeWorkletListener()` from `expo-hinge/reanimated`.
  - `Hinge = { angle, status }`; status is `'closed'|'partiallyOpen'|'fullyOpen'|'unknown'`.
  - Android needs API 30+. "Android has no public API that reports a closed hinge, so the status is never `closed` on Android."
  - Implementation: Android uses the hinge angle sensor plus Jetpack WindowManager `FoldingFeature`; iOS uses `UIHingeInteraction` (iOS 27.1+).
  - No `bounds`/`isSeparating`/`occlusionType`/`orientation` fields.
  - Docs target v58 (~58.0.2). SDK 57 compatibility is not stated.
  - — [expo-hinge docs](https://docs.expo.dev/versions/latest/sdk/hinge/)
  - Apple advice quoted by Expo: "Apple recommends hinge state for interactions and effects, such as a tabletop camera shutter, not for layout." — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58)
- **iOS fold geometry (SDK 58):**
  - `react-native-reserved-regions` provides `useReservedRegions()`, which returns regions with `kind` (`division|occlusion`) and `frame`. Expo calls manual fold layout with it a last resort.
  - `ArrangementView` from `@expo/ui/swift-ui` (split or overlay, iOS 27.1) is preferred.
  - — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
- **Community libraries** (from search-result summaries; repos not opened, last-commit dates not verified unless stated):
  - `react-native-nitro-hinge`: Nitro-based. Size class, safe insets, hinge geometry. RN 0.75+, Android API 24+. Android side adapted from react-native-fold-kit. The npm page showed an update "14 days ago" at search time, i.e. about early November 2026. — [GitHub](https://github.com/eduardoborges/react-native-nitro-hinge); [npm](https://www.npmjs.com/package/react-native-nitro-hinge)
  - `react-native-fold-kit`: posture, hinge angle, fold regions via FoldingFeature. Requires RN 0.82+. — [GitHub](https://github.com/AlexeyTsutsoev/react-native-fold-kit)
  - `react-native-clamshell`: Nitro-based; posture, geometry, hinge angle; Worklets bridge. — [GitHub](https://github.com/shtefanilie/react-native-clamshell)
  - `marcooli/react-native-foldable`: experimental Fabric views; tested baseline RN 0.86.3, which matches Eleva. — [GitHub](https://github.com/marcooli/react-native-foldable)
  - `sambulosenda/react-native-foldable`: New Arch only, iOS-focused, Android "on the roadmap". — [GitHub](https://github.com/sambulosenda/react-native-foldable)
  - `aravi365/react-native-foldable-kit`: TurboModule, RN 0.79+, Android FoldingFeature. — [GitHub](https://github.com/aravi365/react-native-foldable-kit)
- **Microsoft react-native-dualscreen** (`react-native-dualscreeninfo`, `react-native-dual-screen`): I didn't fetch the repo or check its last commit. It targeted Surface Duo, which Microsoft discontinued. Treat it as legacy and unverified.

### Inferences
- **For Eleva (a diary/charts app), layout should key on window width class, not posture.** Tabletop or book posture adds little value: perhaps a chart on the top half and controls on the bottom in tabletop posture, which is optional polish. That matches Apple's guidance quoted by Expo.
- **If posture or hinge bounds are wanted on SDK 57**, sketch of a local Expo module (`modules/fold-info`, created with `npx create-expo-module --local`):
  - **Untested design. Jetpack API names are from Android docs as I know them, not re-verified in this session.**
  - Gradle dependency: `androidx.window:window` (WindowManager 1.3+ / 1.4).
  - Kotlin `Module`: in `OnActivityEntersForeground`, launch a coroutine on the activity's `lifecycleScope` that collects `WindowInfoTracker.getOrCreate(activity).windowLayoutInfo(activity)` inside `repeatOnLifecycle(STARTED)`.
  - For each `FoldingFeature`, emit `onFoldChange` with:
    - `bounds` (px), converted to dp by dividing by `displayMetrics.density`
    - `state` (`FLAT|HALF_OPENED`)
    - `orientation` (`HORIZONTAL|VERTICAL`)
    - `isSeparating`
    - `occlusionType` (`NONE|FULL`)
  - Emit an empty array when no feature is present, i.e. folded or a non-foldable device.
  - JS: `useFoldFeatures(): { features: FoldFeature[] }`, plus derived `posture: 'flat'|'tabletop'|'book'|'unknown'`. Tabletop = `HALF_OPENED` + `HORIZONTAL`; book = `HALF_OPENED` + `VERTICAL`.
  - Hinge avoidance: if `isSeparating && orientation==='VERTICAL'`, size the left pane to `bounds.left` dp and the right pane from `bounds.right`.
  - iOS: return an empty array (or adopt `react-native-reserved-regions` after moving to SDK 58).
  - Effort estimate (inference): roughly one to two days including an example screen and emulator testing. The surface is one Flow-to-event bridge.
- **Prefer upgrading to SDK 58 and using `expo-hinge`** if only angle/status is needed. It still lacks bounds, so a two-pane hinge gap needs either the local module or a community library.

### Gaps
- Last commit/release dates and New Architecture status were not verified for most community libraries or for Microsoft's react-native-dualscreen. The repos and npm pages were not opened.
- Whether `expo-hinge` can be installed on SDK 57 (native module ABI, expo-modules-core version) is unknown.

## Layout techniques: width breakpoints (Material size classes), max-width content, two-column grids, NativeWind 5 responsive variants, avoiding the hinge

### Takeaway
Base everything on window width in dp: compact <600, medium 600–839, expanded ≥840. NativeWind v5 `sm:`…`2xl:` variants do work on native through window-width media queries and update on rotation or split screen without re-render. But the defaults are web-oriented breakpoints, and NativeWind v5 is pre-release. Define custom breakpoints aligned to Material classes in `@theme`, and mirror them in one JS hook.

### Cited Findings
- **Material width classes:** compact <600dp, medium ≥600dp, expanded >840dp ("Tablets and large unfolded foldables in landscape"). They are determined "by the window size available to your application regardless of the type of device". — [Kodeco: Large Screens & Foldables Tutorial for Android](https://www.kodeco.com/34785195-large-screens-foldables-tutorial-for-android) (secondary, 2022-era; thresholds match Android's window-size-class guidance)
- **NativeWind v5:**
  - "Tailwind's responsive variants (sm:, md:, lg:, xl:, 2xl:) work on native by using media queries based on window width."
  - "When the window dimensions change (e.g. device rotation, split screen), styles update automatically without re-rendering."
  - Page header: "This is a pre-release version of Nativewind. It is not intended for production use."
  - Last updated 24 Mar 2026.
  - — [NativeWind v5: Responsive design](https://www.nativewind.dev/v5/core-concepts/responsive-design)
  - NativeWind's default theme "is not yet designed for native devices and still uses breakpoints that were mostly designed for web". — [NativeWind docs: responsive design](https://www.nativewind.dev/docs/core-concepts/responsive-design) (from search snippet)
  - Tailwind v4 defaults: sm 640, md 768, lg 1024, xl 1280, 2xl 1536 (px = dp on native). From Tailwind docs knowledge, not re-fetched; v3 page for reference: [Tailwind responsive design](https://v3.tailwindcss.com/docs/responsive-design)
- Custom breakpoints are set in the Tailwind v4 `@theme` block (`--breakpoint-*`). Keep the JS constants in sync. — [Uniwind breakpoints doc](https://docs.uniwind.dev/breakpoints.md) (Uniwind, not NativeWind; same Tailwind v4 mechanism); [coss.com useMediaQuery](https://coss.com/ui/docs/hooks/use-media-query)
- NativeWind v5 has a "Container Queries" plugin page, contents not verified. — [NativeWind v5 responsive page sidebar](https://www.nativewind.dev/v5/core-concepts/responsive-design)
- iPhone Duo guidance (SDK 58): use `ArrangementView` for side-by-side or overlay around the fold. Use reserved regions only for custom grids "that place the fold between columns". — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)

### Inferences
- **Recommended for Eleva [untested code sketch]:**
  - In `global.css`, define `@theme { --breakpoint-medium: 600px; --breakpoint-expanded: 840px; }` so the variants are `medium:` / `expanded:`. Avoid redefining `md` to a different meaning.
  - Add `hooks/use-window-class.ts`: `const { width } = useWindowDimensions(); return width >= 840 ? 'expanded' : width >= 600 ? 'medium' : 'compact'`, with the same constants exported.
  - Most of the app uses StyleSheet, so the hook will carry most of the logic.
- **Patterns:**
  - Max-width centred content for forms, settings and onboarding: `{ width: '100%', maxWidth: 600, alignSelf: 'center' }`. Use ~840 for dashboard screens.
  - Two-column grids via `flexDirection:'row', flexWrap:'wrap'`, with children at `width: '50%'` when medium or larger. Today's summary cards and charts side by side are natural candidates.
  - List-detail in History on expanded widths.
- **Charts:** charts currently read only `fontScale`. If they size from `onLayout` or a parent width, they adapt automatically. If they assume a full-window width or fixed widths, they will stretch on an ~840dp-wide inner display. Give them a max width or place them in grid cells.
- **Hinge avoidance:**
  - Only matters when `FoldingFeature.isSeparating` is true. Book-style Pixel Fold and Galaxy Z Fold inner displays are seamless and usually report `isSeparating=false` when flat (Android docs knowledge, not re-verified).
  - For a flat unfolded inner display, a simple two-pane layout with a centred gutter is enough.

### Gaps
- I didn't verify whether NativeWind 5.0.0-rc.1 supports `@theme --breakpoint-*` overrides on native, or `max-*` / range variants, beyond the docs saying width media queries are supported.
- The current Android official window-size-class page (including height classes and the newer large/extra-large widths at 1200/1600dp) was not fetched.

## State preservation across fold/unfold; keyboard/insets changes

### Takeaway
With `smallestScreenSize|screenSize|screenLayout|orientation` in configChanges, which Eleva has, fold/unfold does not recreate the activity, so React and navigation state survive. The historical expo-router failure mode ("linking configured in multiple places", lost state) came from recreation. The remaining risks are layout state that depends on width (pager offsets, measured heights, sheet detents) and the keyboard or IME during resize.

### Cited Findings
- Without `smallestScreenSize`, fold/unfold "triggers an activity recreation". In expo-router apps this showed as a "linking configured in multiple places" error, and elsewhere as state loss. Fixed in the template by PR #42150, merged 14 Jan 2026 (SDK 55 per maintainer). — [expo/expo PR #42150](https://github.com/expo/expo/pull/42150); [expo/expo#42294](https://github.com/expo/expo/issues/42294)
- Android 16 notes: "Allowing device rotation results in more activity re-creation, which can result in losing user state if not properly preserved." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Native tabs on Android: `tabBarRespectsIMEInsets` (Android 11+) lifts the tab bar above the keyboard. — [Expo docs: Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- An SDK 58 Android fix keeps native tab content mounted when the tab bar's `hidden` prop changes. — [Expo SDK 58 search summary of expo-router CHANGELOG](https://github.com/expo/expo/blob/main/packages/expo-router/CHANGELOG.md)

### Inferences
- Eleva's Zustand store persisted to AsyncStorage also guards against process death, so data loss isn't the concern. In-progress form inputs in `(modals)/add` are held in component state and survive a config change but not recreation. With the current manifest, recreation shouldn't happen on fold.
- Things to test on fold/unfold:
  - An open formSheet (re-resolving its detent).
  - An open keyboard in the add-entry modal: `adjustResize` plus edge-to-edge, IME insets on the new window.
  - The onboarding pager offset.
  - The JS tab bar height constant (`MATERIAL_NAV_BAR_HEIGHT = 80`) plus the bottom inset on the new window.
  - The `calendar-header` width math.
- **Untested:** react-native-screens fragment behaviour on config change without recreation. No 2025–2026 bug report found specific to fold.

### Gaps
- No specific react-native-screens issue found about fragments or formSheets on fold. Absence of reports is not proof.
- Keyboard-controller and IME inset behaviour across fold/unfold was not researched.

## Testing: Android emulators (Pixel Fold / resizable / Galaxy Z Fold), iPad simulator, Maestro, screenshot tests

### Takeaway
Use Android Studio's **Resizable** AVD (one emulator that switches between phone, foldable, tablet and desktop) and a **Pixel Fold / Pixel 9 Pro Fold** AVD on API 35 and API 36. Running both API levels covers the Android 15 Dimensions report and the Android 16 orientation rules. Use `adb shell am compat enable UNIVERSAL_RESIZABLE_BY_DEFAULT <pkg>` to force the Android 16 behaviour.

On iOS, use an iPad simulator only if `supportsTablet` becomes true. With SDK 58 / Xcode 27.1, Device Hub adds an iPhone Duo simulator with pose and hinge controls.

### Cited Findings
- The Resizable emulator (Android Studio Chipmunk+) "lets you toggle between the four reference devices — phone, foldable, tablet and desktop". Create it via Device Manager → Phone → Resizable. — [Kodeco tutorial](https://www.kodeco.com/34785195-large-screens-foldables-tutorial-for-android) (secondary, older)
- Test flag for the Android 16 behaviour: `UNIVERSAL_RESIZABLE_BY_DEFAULT` via the app compatibility framework. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Xcode 27 replaces Simulator.app with Device Hub, which has a 3D iPhone Duo simulator for poses and hinge angle. Requires Xcode 27.1; on EAS use the `sdk-58` or `latest` image. — [Expo blog: Supporting iPhone Duo](https://expo.dev/blog/supporting-iphone-duo)
- `expo-hinge` returns `null` on devices without a hinge or on older OSes. Check `isAvailable()` first. — [expo-hinge docs](https://docs.expo.dev/versions/latest/sdk/hinge/)

### Inferences
- **Suggested matrix:**
  - Pixel 9 Pro Fold AVD, API 36: cover screen; unfolded portrait; unfolded landscape; split-screen 50/50.
  - Same on API 35.
  - Pixel Tablet AVD, API 36: a portrait-locked app becomes landscape.
  - Resizable AVD for quick resizing.
- Use `adb shell wm size` / `wm density` for quick checks; this is general adb knowledge, not sourced here.
- Samsung offers Galaxy Z Fold emulator skins / Remote Test Lab. Not verified here.
- **Maestro:** the repo has `e2e/`. The same flows can run against a foldable AVD by choosing the device. Maestro has no built-in fold command that I verified, so trigger fold/unfold out-of-band (emulator extended controls or `adb emu fold` / `adb emu unfold`; these commands are not verified in this session). Take screenshots with Maestro `takeScreenshot` per state.
- **Screenshot tests per size class:** with jest-expo and `@testing-library/react-native`, mock `useWindowDimensions` (or the custom `useWindowClass`) to 411/673/900dp and snapshot key screens. This catches layout-branch regressions but not native presentation. **Untested.**

### Gaps
- Current official Android docs for foldable AVDs, `adb emu fold` and posture controls were not fetched (a 404 on the URL tried).
- I didn't find Maestro documentation on foldables, large screens or posture changes.
- No 2025–2026 conference talk (App.js, React Universe) on RN foldables was found within the search budget.
