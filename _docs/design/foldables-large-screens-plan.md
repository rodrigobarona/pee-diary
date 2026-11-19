# Foldables and large screens — redesign plan

> **Branch:** `design/foldables-large-screens`
> **Date:** 19 November 2026
> **Research:** [`reports/Foldable phone design for Eleva Diary.md`](../../reports/Foldable%20phone%20design%20for%20Eleva%20Diary.md) (sources for every rule below), notes in `research_notes/Foldable phone design for Eleva Diary/`
> **Status:** plan only. No app code has changed on this branch yet.

## 1. Why this is needed

The current design is a phone design. It does not fit foldables, and both platforms now override the portrait lock on exactly the screens where that shows.

| Device | What Eleva 1.0 does today | When it changes |
|---|---|---|
| Galaxy Z Fold 7/8, Pixel 10/11 Pro Fold, unfolded (≥ 600dp) | Android 16 with targetSdk 36 **ignores `screenOrientation="portrait"`**. The phone layout is stretched across the inner screen, with a full-width tab bar, single-column cards and charts, and edge-to-edge sheets. It rotates to landscape. | Now. The temporary opt-out (`PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`) brings back letterboxing, which fails Play's baseline tier, and it stops working at API 37 (Play requirement August 2027). |
| iPhone Duo, inner 7.6" screen | Built with Xcode 26.5, the app runs as a small iPhone-sized window with black borders, the same complaint Duo owners have about other apps. | The first build on the iOS 27.1 SDK (Expo SDK 58 / Xcode 27.1) makes the app full-screen, resizable and rotatable on the inner screen, with no opt-out. Duo screenshots are required from April 2027 for 27.1 builds. |
| Cover screens, Flip FlexWindow, phones | Fine: they are compact (< 600dp), and the lock is still honoured | No change |
| iPad | Runs as a resizable iPhone window (iPadOS 26) | Only if we turn on `supportsTablet` |

Foldables are only about 2% of European phone sales, so the reason to act is the platform rules and the store quality tiers, not the audience size. Play's *Adaptive app quality* tiers (renamed in 2026) grade this, and the "Optimized for large screens" badge (May 2026) requires Tier 2.

## 2. Design principles

1. **Lay out by window width, never by device or orientation** (Apple HIG Layout; Android window size classes). The same rules then cover foldables, tablets, split screen and desktop windows.
2. **Today's design stays as the compact layout.** Nothing changes on phones or cover screens.
3. **Two breakpoints, the same on both platforms:** 600 and 840 (dp on Android, pt on iOS).

   | Class | Width | Devices | Eleva layout |
   |---|---|---|---|
   | compact | < 600 | phones, cover screens, Duo side-by-side | today's design |
   | medium | 600–839 | Fold/Pixel Fold inner, Duo inner portrait | rail, 2-column Today, capped forms |
   | expanded | ≥ 840 | inner screens in landscape, Duo inner landscape, tablets | rail, Today with timeline pane, History list-detail |

4. **"Don't reinvent the app when it resizes"** (Apple's Duo guidelines). The same cards, the same order and the same colours. Only the columns and panes change, and the state never resets.
5. **Even column counts, nothing across the middle of a book foldable.** Two-pane layouts use a 24dp gutter on the centre line.
6. **Readable widths:** text stays at about 45–75 characters per line, so forms are capped at 560–640 and Settings at about 600.
7. **Accessibility first.** Choose one or two panes by the width each pane would get at the current text size. With very large text, fall back to one pane (each pane needs ≥ ~320dp). Touch targets stay ≥ 48dp.

## 3. Screen by screen

Visual references come from Mobbin: iPhone screens for the phone layout, and web apps for wide-layout structure only (Mobbin has no iPad or foldable screens).

### 3.1 Navigation: bottom bar → rail (from 600)
- Compact: keep the current custom `AppTabBar` with the centre + (similar to [Bevel's floating bar](https://mobbin.com/screens/2d3e8d5f-f3f1-4370-8b34-f914c8eb31ed)).
- From medium: the same `tabBar` renders as a **vertical rail on the leading edge**, about 80dp wide. The **+ sits at the top as a FAB**, with Today and History below it and Settings at the bottom. The + then sits under the thumb of the hand holding the side of the device, and on the Duo it matches the system's vertical side bar.
- Stay on the JS tab bar. Native tabs would give the Duo/iPad sidebar for free, but they can't host the centre +, and they don't become a Material rail on Android.
- Code: `app/(tabs)/_layout.tsx` (`AppTabBar`, the `iosCentreGap = width / 6` maths), plus the content inset for the rail.

### 3.2 Today
- **Compact:** unchanged ([Withings](https://mobbin.com/screens/57e69e10-f0a7-4651-a187-c06b6f52f949) and [Noom](https://mobbin.com/screens/446f528a-16b4-4961-9a83-617bed75679f) show the same stacked-card pattern).
- **Medium:** a two-column grid. Put the three stat cards (fluids, bathroom visits, leaks) in one row, as Fitbit did with its rings in 2024. The week/month chart sits beside the intake-and-output chart, and the summary cards fill a 2-column grid ([Bevel stat grid](https://mobbin.com/screens/5addacbb-f7a4-4548-aac5-25863dae8bd9)).
- **Expanded:** a 70/30 supporting pane. Cards and charts go in the main area, and the **timeline (Early hours … Night) moves into a side pane** ([Perplexity Health dashboard](https://mobbin.com/screens/5e42f20d-0ce8-4423-bda5-a4235d18c5e6), [Copilot Money](https://mobbin.com/screens/1bfa784d-99eb-4850-88e2-4064d4d06452)).
- Charts go in grid cells with a maximum width (about 560), so a 900dp chart never shows giant bars. Each chart's fluid scale already adapts to its data.
- Code: `app/(tabs)/(today)/index.tsx`, `components/diary/{weekly,monthly,fluid-balance}-chart.tsx`, `insight-card.tsx`, `time-group-summary.tsx`.

### 3.3 History: list-detail
- **Compact:** unchanged (calendar strip, filters, list, entry detail modal).
- **Expanded**, and medium when both panes keep ≥ 320dp at the current font scale:
  - The left pane holds the month calendar, filter chips and the day's list.
  - The right pane shows the **entry detail/edit inline** instead of the `(modals)/entry/[id]` modal.
  - Tapping a day updates the list in place.
  - References: [Rise](https://mobbin.com/screens/6da90a11-a3da-44bc-858f-cb5a36e9bf72), [Upwork work diary](https://mobbin.com/screens/b2768de7-eab0-49c5-a802-070901010baa), [Calendly](https://mobbin.com/screens/3b379998-72b4-4313-b418-ee0cb610baac), [Perplexity Health history](https://mobbin.com/screens/20122940-8ac0-4b93-980a-b4ac799c9b5b).
- With no entry selected, the right pane shows the day summary (totals for the chosen day). It is never empty.
- Fold continuity:
  - Narrowing (fold) keeps the open entry visible as today's modal/detail.
  - Widening (unfold) highlights the selected entry in the list.
  - An unsaved edit is never lost.
- Code: `app/(tabs)/history/index.tsx`, `components/diary/calendar-header.tsx` (its `windowWidth` maths), and the form body of `app/(modals)/entry/[id].tsx` extracted into a component that both the modal and the pane use.

### 3.4 Entry forms (add urination / fluid / leak, edit entry)
- From medium: a **centred card about 600 wide**. The form scrolls inside it, and Save stays reachable even in landscape with the keyboard up ([Xero](https://mobbin.com/screens/2eec6581-658a-4b97-836a-35def27c63ea)).
- From medium, the date and time fields sit side by side ([Workable](https://mobbin.com/screens/2d6b1dd4-336d-4deb-845a-d42f2caf059b)). The volume tiles, urgency scale and drink-type grid keep their phone size, centred, and are not stretched.
- Two ideas from the references that work on every width, in a separate decision (not part of this plan): "Save & add another", and quick increments on the drink amount (the fluid picker already has ±50).
- Code: `app/(modals)/add/*.tsx`, `app/(modals)/entry/[id].tsx`, `components/ui/form-scroll-view.tsx`, `hooks/use-entry-form-header.tsx`.

### 3.5 Sheets (add menu, fluid target, export, language, reminder interval)
- Content capped at 640 and centred. iOS already centres `formSheet` on regular width. On Android this is unconfirmed, so we cap it ourselves and check.
- On the rail, the add menu can become a small menu anchored to the + FAB. Decide after the first build.
- Code: `app/(formSheets)/*.tsx`, `sheetOptions` in `app/_layout.tsx`.

### 3.6 Settings, onboarding, error screens
- Settings: one readable column of about 600, centred. A sidebar-plus-section layout ([Buffer](https://mobbin.com/screens/0398e56b-5120-4055-9348-2b046ded2e97)) only if Settings grows.
- Onboarding: the pager uses `pageWidth` from `useWindowDimensions` (`welcome.tsx:442`). It must re-measure and stay on the same page when the window changes, with the content capped at about 480.
- The load-failed and error screens already cap at 360.

## 4. Engineering foundation

1. **`hooks/use-window-class.ts`:** returns `{ widthClass: "compact" | "medium" | "expanded", width, height }` from `useWindowDimensions()` at render time.
   - Breakpoints live in one constant (`lib/theme/breakpoints.ts`).
   - Never cache dimensions in module scope or zustand.
   - Cross-check with `useSafeAreaFrame()` to guard against the open Android 15 stale-dimensions bug (react-native#52952).
2. **`<ContentWidth max={600}>`**, a centring wrapper used by forms, sheets, Settings and onboarding.
3. **`<AdaptiveColumns>`**, a 1/2-column grid for Today (even counts, 16/24dp gaps).
4. Keep `orientation: "portrait"` for phones and cover screens (Android honours it below 600dp, and iOS on the Duo's outer screen), but design every medium and expanded layout for **both orientations**.
5. Do **not** add the Android restricted-resizability opt-out (it brings back letterboxing, fails Tier 3 and ends at API 37). Do not use `expo-router/unstable-split-view` (alpha, iOS only, falls back to a `Slot` on Android), posture or hinge APIs, or a NativeTabs migration. None is needed for a diary.
6. NativeWind `medium:`/`expanded:` variants only if they are verified on 5.0.0-rc.1; otherwise the hook carries the logic (most styles are StyleSheet anyway).

## 5. Phases

| Phase | Scope | Effort | Done when |
|---|---|---|---|
| **0. Foundation** | `useWindowClass`, breakpoints, `ContentWidth`; onboarding pager and calendar-header width fixes | S | Unit tests for the hook; nothing changes below 600 |
| **1. Stop the stretching** | Width caps on forms, sheets and Settings; Save reachable; fold-continuity test pass and fixes | S | **Play Tier 3 ("Adaptive ready")**: no state lost on rotate, fold, unfold or resize, tested mid-entry |
| **2. Real large-screen layouts** | Navigation rail; Today grid (medium) and supporting pane (expanded); History list-detail with inline detail; keyboard basics (Esc closes, Tab order) | M–L | **Play Tier 2 ("Adaptive optimized")**; badge application possible |
| **3. iPhone Duo** | Upgrade to Expo SDK 58 / RN 0.88 / Xcode 27.1; UIScene check; audit horizontal safe areas (84pt rail inset); test in Device Hub | M–L | App fills the Duo inner screen correctly in every pose; before the iOS 27 SDK deadline (expected ~April 2027) |
| **4. Store assets** | Play: unfolded 1:1 and 4:3 plus folded screenshots; App Store: Duo screenshots; EN/PT/ES each, from `store-screenshots.py` with new sizes | S–M | Listings updated; Play badge form sent |
| **Later** | `supportsTablet` and 13" iPad screenshots; quick-log home-screen/FlexWindow widget (no health app has one) | — | Owner decision |

Phases 0 and 1 belong in the next Android update, because Fold users see the stretched app now.

## 6. Testing

- **Android emulators:** Foldable 4:3, Foldable 1:1, Pixel Fold, Medium Tablet and Resizable, each on **API 35 and API 36** (the dimensions bug is specific to Android 15).
  - Fold and resize with `adb emu fold` / `unfold` / `rotate` / `resize-display`.
  - Force the large-screen behaviour on any build with `adb shell am compat enable UNIVERSAL_RESIZABLE_BY_DEFAULT care.eleva.peediary`.
- **Real hardware:** Samsung Remote Test Lab (Galaxy Z Fold 7/8) for one pass per phase.
- **iOS:** the iPhone Duo simulator in Xcode 27.1 Device Hub (phase 3); iPad in Windowed Apps mode for a quick check now.
- **Maestro:** extend `e2e/walkthrough` with a foldable run, fold and unfold out of band with `adb emu`, and capture the new store screenshots there.
- **Jest:** render Today, History and the add form with `useWindowClass` mocked at 411, 673 and 900 to catch layout-branch regressions.
- **The fold script for every screen** (Tier 3): scroll, type a note with the keyboard up, then rotate, fold, unfold and resize. Nothing may be lost: note text, time, selected entry, open sheet and pager page.

## 7. Review gate

The existing rule applies: the judge panel (App Store, Google Play, Localization, Engineering, UX) must score **≥ 8.0** on each phase before it merges to `main`, with screenshots at 411, 673 and 900 wide in EN/PT/ES.

## 8. Decisions for the owner

1. **Rail from 600 or from 840?** The plan uses 600, as Compose, Play Tier 2 and the Duo do. Material's own site may say 840.
2. **Timing of the SDK 58 upgrade** (phase 3). It brings the Duo handling, but the whole app needs re-testing.
3. **iPad support** (`supportsTablet`). Most of the work is shared with phase 2, but it adds 13" screenshots in three languages and iPad multitasking support.
4. **Quick-log widget** for home screens and the Flip cover screen: a differentiator, but large effort.
