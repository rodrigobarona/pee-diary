# How health, diary and tracking apps adapt to foldables and large windows (research as of 19 Nov 2026)

Scope note: no screenshots could be retrieved (Mobbin was not queried, and app-store tablet screenshots were not fetchable), so every app observation below comes from text. "Verified" means an official doc or a dated tech-press report. "Anecdote" means a user forum post or a secondary or unofficial source.

## 1. How named health and tracking apps lay out dashboards, calendars, lists and forms on book foldables and tablets

### Takeaway
Few named health apps have published or been reported to have a real large-screen layout. The one well-documented case, Fitbit (now Google Health), went from a stretched or letterboxed phone app to a modest card reflow: rings side by side and two columns of stat cards in landscape, rather than a full list-detail or rail redesign. Apple Health on iPad (since iPadOS 17, 2023) uses a sidebar plus a richer card and chart area. For Samsung Health, Flo, Clue, Bearable, Daylio, MyFitnessPal, Medisafe, Withings and Oura, I found no reliable description of their unfolded or tablet layouts.

### Cited Findings
**Fitbit / Google Health (verified tech press)**
- Nov 2024, Fitbit for Android v4.30: four customisable stat rings now sit side by side in both orientations. Before that, one large ring sat above three small ones. In landscape, a dual-column layout keeps a stat card from spanning the full screen width. The article calls this "a much more efficient use of space in landscape" and mentions next/previous-day controls. It does not mention a navigation rail. — [9to5Google, 19 Nov 2024](https://9to5google.com/2024/11/19/fitbit-foldable-tablet-redesign/)
- Before that change, Fitbit on large screens was described as "just a stretched-out phone app". — [PhoneArena](https://www.phonearena.com/news/fitbit-android-redesign-tablets-foldables_id164982) (search snippet only, not fetched)
- Pixel Fold review, June 2023: Fitbit is listed alongside Instagram, Twitter and Messenger as a phone-sized app with black bars on either side on the unfolded screen. — [Daring Fireball linking a Pixel Fold review, 26 Jun 2023](https://daringfireball.net/linked/2023/06/26/pixel-fold-review) (search snippet)
- May 2026: the Fitbit app became the Google Health app (v5.0). It has four tabs (Today, Fitness, Sleep, Health), a customisable dashboard at the top of Today and Health, and Coach insights on Today. The announcement says nothing about tablets or foldables. — [Google blog, 7 May 2026](https://blog.google/products-and-platforms/products/google-health/google-health-app/); [TechRepublic](https://www.techrepublic.com/article/news-google-health-fitbit-app-ai-coach-widget/) (snippet: Google Health 5.0 brings an Android widget)

**Apple Health on iPad (verified tech press)**
- Health arrived on iPad with iPadOS 17 (2023). It has a sidebar for switching categories (Activity, Body Measurements, Heart, Mental Well-being and others), a redesigned Favorites view, and "detailed interactive charts" plus Trends and Highlights. In the sleep section the iPad shows four metrics at once (heart rate, sleep this week, respiratory rate, sleep this month). — [BGR hands-on, 12 Jul 2023](https://bgr.com/tech/hands-on-with-the-all-new-ipados-17-health-app/)
- Apple's HIG says a split view gives the primary pane 1/3 of the width and the secondary pane 2/3 by default, with 50/50 also available. It recommends split views only in regular (not compact) width, says to check the layout at multiple widths because iPad windows resize fluidly, and says to use a sheet for "a small amount of information or a simple task". — [Apple HIG: Split views](https://developer.apple.com/design/human-interface-guidelines/split-views)
- WWDC25: when an iPad rotates to portrait, a sidebar can morph back into a tab bar. — [WWDC25 session 208 index](https://nonstrict.eu/wwdcindex/wwdc2025/208/) (search snippet)

**Samsung Health (verified, partial)**
- Samsung Health got a major UI redesign for phones and tablets, rolling out from 8 June 2026. It is organised around five pillars: Activity, Mindfulness, Nutrition, Sleep and Vitals. No source describes its column count or pane structure on the Fold main screen or a Tab. — [SamMobile, 4 Jun 2026](https://www.sammobile.com/news/major-samsung-health-update-revamped-ui-new-ai-features)
- Samsung lists Samsung Health among apps "further optimised" to activate automatically when a Flip or Fold is tilted (Flex mode). It does not say what the Flex layout looks like. — [Samsung UK: What is Flex Mode](https://www.samsung.com/uk/mobile-phone-buying-guide/samsung-flex-mode/) (search snippet)
- A related Samsung app, Samsung Food, added a dual-column recipe page on tablets, but the rest of that app was not redesigned. — [SamMobile, 30 Sep 2025](https://www.sammobile.com/news/samsung-food-big-update-tablet-users-any-good/)

**Daylio (anecdote)**
- An App Store user review says Daylio eventually shipped iPad support after users asked for it. The listing is iPad-compatible (iPadOS 14+). No layout details were found. — [Daylio App Store listing](https://apps.apple.com/app/id1194023242)

**Rail vs bottom bar in practice**
- No health app was confirmed to use a navigation rail on foldables. The Android guidance (see section 2) recommends one.

### Inferences
- The realistic bar set by mainstream health apps is low: "not letterboxed, cards reflow into 2 columns, rings/stat tiles in one row". An app that also adds a rail and a list-detail History would be ahead of Fitbit/Google Health, as documented.
- The Fitbit change maps directly onto Eleva's Today screen. The three stat cards (fluids, bathroom visits, leaks) can go in one row. Summary cards and charts can go in a two-column grid so no single card spans about 800dp or more.
- Apple Health's model (sidebar plus card/chart grid, sidebar collapsing to a tab bar in narrow windows) is the closest analogue to Eleva's tab bar becoming a rail when unfolded.

### Gaps
- I found no verified descriptions or screenshots of the unfolded or tablet layouts of Samsung Health (post-June 2026), Flo, Clue, Bearable, MyFitnessPal, Medisafe, Withings Health Mate or Oura. Fetching a Fitbit community thread on foldable support redirected to the Google Health support community, so its content was not retrieved.
- I found no evidence of any health app using tabletop / Flex mode for a chart-on-top, controls-below layout. Samsung only says Samsung Health "activates" in Flex mode.
- Mobbin and app-store iPad screenshots were not examined, so there are no visual pattern references.

## 2. What Samsung, Google (Android) and Apple recommend for dashboards, calendars and forms

### Takeaway
All three platform owners converge on the same rules:
- Switch to a large-screen layout at 600dp or more.
- Use list-detail for list-plus-item screens, using a 50:50 split on Fold or roughly 1/3 to 2/3 elsewhere.
- Use a supporting pane (about 70/30) for main content plus related tools or info.
- Use a feed or grid with a variable column count for card dashboards.
- Use a navigation rail instead of a bottom bar.
- Never let sheets, buttons or text fields span the full width.
- Show short tasks in small pop-ups or sheets that keep context visible.

### Cited Findings
**Google / Android (verified, official docs)**
- Window size classes: compact is under 600dp, medium is 600–839dp, expanded is 840dp or more. List-detail shows both panes at expanded width and one pane at a time at medium/compact widths. — [Android canonical layouts](https://developer.android.com/guide/topics/ui/layout/canonical-layouts)
- On resize, list-detail must keep state:
  - Expanded narrowing to compact keeps the detail pane visible.
  - Detail-only widening to expanded shows both panes with the item highlighted in the list.
  - List-only widening shows the list plus a placeholder detail pane.
  — [Android canonical layouts](https://developer.android.com/guide/topics/ui/layout/canonical-layouts)
- Supporting pane: the main area takes about two-thirds. On compact screens the pane goes below the content or into a bottom sheet. At 600dp or more the two split 50/50. At 840dp or more the supporting pane takes 30% and the main content 70%. — [Android canonical layouts](https://developer.android.com/guide/topics/ui/layout/canonical-layouts)
- Feed: equivalent cards in a grid that adapts from one scrolling column to multiple columns. Group items by making them equal size and emphasise items by making them larger. Set a minimum item width and derive the column count from the available width. — [Android canonical layouts](https://developer.android.com/guide/topics/ui/layout/canonical-layouts)
- Adaptive app quality Tier 2, guideline `Responsive_adaptive_layouts`:
  - leading-edge navigation rails that expand into panels on larger windows
  - grids that scale their column count
  - columns of text on large screens
  - multi-pane layouts using `ListDetailPaneScaffold`
  — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Tier 2, guideline `UI_Secondary_Elements`:
  - "Bottom sheets are not full width on large screens. (Apply a maximum width to avoid stretching.)"
  - "Buttons are not full width on large screens."
  - "Text fields and boxes don't stretch to full width."
  - "Small edit menus or modals don't cover the entire screen and maintain context"
  - "Navigation rails replace navigation bars for better ergonomics on large screens"
  — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Navigation by width: compact uses a bottom navigation bar; medium uses a navigation rail; expanded uses a rail or a persistent drawer. In Material 3 Expressive, the expanded rail replaces the drawer. — [Android: Build responsive navigation](https://developer.android.com/develop/ui/views/layout/build-responsive-navigation); [9to5Google on M3 Expressive navigation, 14 May 2025](https://9to5google.com/2025/05/14/material-3-expressive-navigation/)
- FAB placement: a FAB can sit at the top of the rail, and the FAB and menu items stretch to fill an expanded rail. This comes from SAP's Fiori Android rail guidance (M3-based); I did not retrieve official M3 FAB-on-rail rules. — [SAP Fiori for Android: Navigation rail](https://www.sap.com/design-system/fiori-design-android/v25-8/components/m3-standard-components/navigation-rail/usage)
- The Android test matrix includes a 1:1 foldable inner display (802×802dp), a 4:3 foldable (1024×768dp), an 8" tablet (1024×640dp) and a 10.5" tablet (1280×800dp). Play store listings should include screenshots of unfolded inner displays (1:1 and 4:3) and folded outer screens. — [Android adaptive app quality overview](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality)
- The large screens gallery groups examples by category (media, shopping, social, productivity, creativity, games). In the category pages I could see, there was no health or fitness category. — [Android large screens gallery: media](https://developer.android.com/large-screens/gallery/media); [shopping](https://developer.android.com/large-screens/gallery/shopping)

**Samsung (verified, official docs)**
- Breakpoints: compact under 600dp; medium 600–839dp, which includes the Z Fold main screen in both portrait and landscape; expanded 840dp or more. The core rule: "Use a large screen layout for screens with a width of 600dp or more." — [Samsung One UI: Layout design for large screens](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html)
- Keep menus visible next to content at all times. Adjust grids to show more information. Use a small pop-up rather than a full-screen view for brief tasks so the previous screen stays visible. Consider grip: the One UI Camera moves its controls to the right edge instead of the bottom. — [Samsung One UI: Layout design for large screens](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html)
- Recommended split for Z Fold: 50:50. Medium windows use 42:58 and wider windows 38:62. List alongside detail "flattens navigation" with no full-screen transition. Users are unhappy when an app is "simply stretched out" on the main screen. — [Samsung: designing for foldable](https://developer.samsung.com/one-ui/largescreen-and-foldable/designing_for_foldable.html) (ratios from search snippet; the fetched page text did not repeat them)
- Continuity: "When users open their device, your app should appear on the main screen, right where the user left off". Also: "keep the scroll position the same"; "the text input and keyboard should remain when switching". Each screen should have its own optimised layout, with no letterboxing. — [Samsung: designing for foldable](https://developer.samsung.com/one-ui/largescreen-and-foldable/designing_for_foldable.html)

**Apple (verified, official docs)**
- Split views: 1/3 primary to 2/3 secondary by default, or half and half. Use them only in regular width. Prefer a split view over a new window for supplementary info, and a sheet for small, self-contained tasks. — [Apple HIG: Split views](https://developer.apple.com/design/human-interface-guidelines/split-views)
- A sidebar can take a lot of horizontal space. On iPad people expect an edge swipe to show or hide it. Narrow screens should use a tab bar instead. — [Apple HIG: Sidebars](https://developer-mdn.apple.com/design/human-interface-guidelines/components/navigation-and-search/sidebars) (search snippet)

### Inferences (mapping to Eleva screens)
- **Today:** treat it as a feed. At medium width (Fold portrait/landscape, about 600–839dp), use a 2-column card grid. Put the three stat cards in one row and pair the week/month chart with the intake-vs-output chart. At expanded width (840dp or more), consider a 70/30 supporting pane: dashboard and charts in the main area, and the timeline grouped by part of day in a 30% side pane.
- **History:** this is the clearest list-detail case. Put the month calendar strip, filter chips and the day's entries in the list pane, and the entry detail/edit form in the detail pane (50:50 on Fold per Samsung, or 1/3 to 2/3 on tablet per Apple). On fold/unfold, follow Android's state rules (keep the selected entry, highlight it in the list).
- **Modal entry forms and sheets** (fluid target, reminder interval, export): use a centred dialog or a max-width sheet on large screens, never full-width. Do not let text fields or the save button stretch.
- **Bottom tab bar with centre +:** at 600dp or more, switch to a navigation rail with the + as a FAB at the top of the rail, per M3 rail conventions as described by SAP, not official M3 text.
- **Settings:** a single list can stay a list. Samsung explicitly says some screens, such as settings, need no layout change in Flex mode. On wide screens, cap its width or use list-detail (categories on the left, the selected sheet's content on the right).

### Gaps
- I did not retrieve Material 3's exact numbers for bottom-sheet max width, text-field max width or FAB placement in a rail. m3.material.io was not fetched.
- Apple's HIG Layout page (readable width guidance) returned no body text.
- No calendar-specific large-screen guidance was found from any platform.

## 3. Common failures reviewers and users complain about on foldables

### Takeaway
The documented complaints are mostly letterboxing or phone-width windows with huge side bars, and phone layouts stretched with wasted white space. Android 16/17 is now removing developers' ability to letterbox by locking orientation. Google's quality bar adds a third failure: lost state on fold, unfold or resize (scroll position, typed text, keyboard).

### Cited Findings
- Android Authority, 8 Nov 2026, "worst apps on foldables":
  - Snapchat: "gigantic borders" left and right.
  - Slack: phone layout enlarged with "a ton of white space".
  - Uber/Uber Eats: "a sliver of an app window with huge borders".
  - Apple Music: "a ton of wasted space on either side".
  - Instagram: "copious amounts of white space".
  - X: "a crazy amount of wasted space".
  - Facebook: "annoyingly narrow app window" in landscape.
  No health apps are named. — [Android Authority, 8 Nov 2026](https://www.androidauthority.com/worst-android-apps-foldables-3729614/)
- Google-owned Fitbit was letterboxed with black bars on the Pixel Fold in 2023. — [Daring Fireball, 26 Jun 2023](https://daringfireball.net/linked/2023/06/26/pixel-fold-review) (snippet)
- Anecdote: on Samsung inner screens, some apps with a large-screen layout (Discord, Gmail) only show it after rotating 90°. — [MacRumors forum](https://forums.macrumors.com/threads/galaxy-z-fold7-flip7.2450108/page-41) (snippet). Samsung lets users force apps to the inner display's aspect ratio. — [Lemmy thread](https://lemmy.nekusoul.de/post/14204/131428) (snippet, anecdote)
- Samsung publishes a troubleshooting page about third-party app errors when folding or unfolding the Galaxy Z TriFold, so state and continuity bugs are common enough to warrant official support content. — [Samsung US support](https://www.samsung.com/us/support/troubleshoot/TSG10010299/) (snippet)
- Platform enforcement (verified):
  - Android 16 made ignoring orientation and resizability restrictions the default on large screens, with a temporary opt-out (`PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`).
  - On Android 17, for apps targeting API 37 or higher, `screenOrientation`, `resizeableActivity`, `minAspectRatio` and `maxAspectRatio` are ignored on displays with smallest width over 600dp. Games and users who opt in through aspect-ratio settings are exempt.
  - Google suggests capping element widths to cope.
  — [Android 17 behaviour change](https://developer.android.com/about/versions/17/changes/ff-restrictions-ignored); [Android Developers blog, Feb 2026](https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17); [Flutter breaking-change note](https://docs.flutter.dev/release/breaking-changes/android-large-screens-restrictions-ignored)
- Tier 3 (the baseline Play quality bar), guideline `Config_Changes`:
  - The app must not be letterboxed or run in compatibility mode.
  - It must retain state through rotation, fold/unfold and window resizing: scroll position kept, "text typed into text fields is retained and the keyboard state is restored".
  - `Config_Combinations` requires surviving combined changes, such as resize then rotate, or rotate then fold.
  — [Android Tier 3](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-3)
- Tier 2 lists full-width bottom sheets, full-width buttons, stretched text fields and full-screen small modals as failures. — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Samsung says to avoid putting interactive elements near the crease in the middle of the screen (Flex mode). — [Samsung: designing for foldable](https://developer.samsung.com/one-ui/largescreen-and-foldable/designing_for_foldable.html)

### Inferences
- For an Expo / React Native app, the highest-risk items are:
  1. a portrait orientation lock in app.json, which is ignored or letterboxed on Fold depending on target SDK
  2. modal forms and sheets (fluid target, export) rendering full-width
  3. an open entry form losing typed notes or the chosen time when the user unfolds mid-entry
  4. History losing the selected day or entry on unfold
- Charts with huge bars are not explicitly cited by any source, but the same principle applies (cap element widths, scale the grid). A week chart stretched to about 800dp would be the chart version of the stretched-list complaint.

### Gaps
- I found no Reddit (r/GalaxyFold, r/PixelFold) threads naming specific health apps (MyFitnessPal, Oura, Flo, Clue, Medisafe) with dated complaints. The search returned only general foldable threads.
- I found no specific reports of the keyboard covering fields on foldables for health apps. Google's checklist covers keyboard state retention, not occlusion.

## 4. Cover screen (Flip FlexWindow / Fold cover display) quick-log patterns

### Takeaway
The official, documented cover-screen pattern for health is a read-only widget: Samsung Health's FlexWindow widget shows sleep and Energy Score. I found no evidence of a one-tap logging widget for water or similar on the cover screen. On the Fold cover display, Samsung and Google mainly require that the full app works and hands off seamlessly to the main screen.

### Cited Findings
- One UI FlexWindow widgets include Weather, Samsung Health, Battery, Reminder, Calendar and Clock. The Samsung Health widget lets you "check your sleep and Energy score" on the cover screen. — [Samsung One UI features](https://www.samsung.com/ie/one-ui/features/) (search snippet)
- The Z Flip8 FlexWindow guide says widgets can be added and customised from the cover screen and that "third-party app support is subject to expansion". — [Samsung: FlexWindow on Galaxy Z Flip8](https://www.samsung.com/au/support/mobile-devices/intuitive-flexwindow-galaxy-z-flip8/) (snippet)
- Samsung Health water tracking is documented for phone and watch only, not the cover screen. A 2024 Samsung Community post asked for a water widget, which suggests one did not exist then (anecdote). — [Samsung US: Health tracking](https://www.samsung.com/us/support/answer/ANS10006889/); [Samsung Community post](https://r2.community.samsung.com/t5/Galaxy-S/WATER-Widget-in-Samsung-Health/td-p/16144086)
- Google Health 5.0 (May 2026) ships an Android home-screen widget. I found no details on whether it supports logging. — [TechRepublic](https://www.techrepublic.com/article/news-google-health-fitbit-app-ai-coach-widget/) (snippet)
- Samsung's cover screen guidance: give each screen an optimised layout, fill the screen without letterboxing, and resume "right where the user left off" on unfold, keeping scroll position and keyboard/text input. — [Samsung: designing for foldable](https://developer.samsung.com/one-ui/largescreen-and-foldable/designing_for_foldable.html)
- Android Tier 1 has a separate Widgets quality track. — [Android Tier 1](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-1)

### Inferences
- A borrowable pattern for Eleva is a small home-screen widget, which can also be placed on FlexWindow where Samsung allows third-party widgets. It would show today's counts (fluids, visits, leaks) plus 2–3 one-tap log buttons (for example "+ bathroom", "+ 250 ml") that write an entry with the current time, with full details editable later in the app. No health app was verified doing this on the cover screen, so it would be a differentiator rather than an established convention.
- For the Fold cover display, the main requirement is continuity: starting an entry on the cover screen and unfolding should keep the same form with the same values.

### Gaps
- I found no source showing a health or diary app with an interactive quick-log widget on a Flip cover screen. Third-party widget support on FlexWindow depends on Samsung's allow-list, and the details were not confirmed.
- Flex mode on Fold8: a retailer Q&A ([ShopSavvy](https://www.shopsavvy.com/answers/samsung-galaxy-z-fold-7-flex-mode-apps-split-screen)) claims Flex mode is not supported on the Galaxy Z TriFold or Z Fold8. This is unverified and from a low-quality source; it needs confirming against Samsung's own docs before relying on it.

## 5. Accessibility on large screens: line length, reach, large text in multi-pane

### Takeaway
Keep text columns to roughly 45–75 characters per line, with 50–70 the most-cited readable range. Keep touch targets at least 48dp. Move primary controls to the edges people hold (rail on the leading edge, controls toward the side) rather than the bottom centre of a wide screen. Multi-pane layouts must collapse back to one pane when the window or text size makes panes too narrow.

### Cited Findings
- Line length: 45–75 characters per line (including spaces) is the typical print-derived range, and the web can stretch to about 45–85. A 2005 literature review found 50–70 cpl easiest to read. The rationale is eye travel back to the next line. — [Optimal Line Length in Reading, literature review (Visible Language)](https://journals.uc.edu/index.php/vl/article/view/5765); [Practical Typography: line length](https://practicaltypography.com/line-length.html); [Smashing Magazine](https://shop.smashingmagazine.com/2014/09/balancing-line-length-font-size-responsive-web-design/). NN/g-attributed figures (such as "66 characters") appeared only in secondary blogs and could not be verified on nngroup.com.
- Touch targets must be at least 48dp and must not be hidden or obscured at any display size or configuration (guideline `Touch_Targets` and test `T-Touch_Targets`). — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
- Reach:
  - Navigation rails replace bottom bars "for better ergonomics on large screens". — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2)
  - Samsung: consider how users hold larger devices; the Camera app puts controls on the right, not the bottom. — [Samsung One UI large screen layout](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html)
  - Keep interactive elements away from the crease. — [Samsung: designing for foldable](https://developer.samsung.com/one-ui/largescreen-and-foldable/designing_for_foldable.html)
- Keyboard and external input: Tier 2 requires Tab/arrow navigation through main flows, Esc to close modals and dialogs, and visible focus states on custom interactive drawables. Tier 3 requires switching between physical and virtual keyboards without relaunch. — [Android Tier 2](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2); [Android Tier 3](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-3)
- Apple: split views only in regular width; in narrow (compact) windows, such as iPad Split View at 1/3 width, use a single column or tab bar. — [Apple HIG: Split views](https://developer.apple.com/design/human-interface-guidelines/split-views); third-party summary of the 1/3 width = compact claim: [ipados-design-guidelines skill summary](https://skills.sh/ehmo/platform-design-skills/ipados-design-guidelines) (unofficial)

### Inferences
- Cap note text, onboarding body copy and Settings descriptions at about 60–70 characters per line, roughly 560–640dp max content width at default font size, even when the window is 800dp or more. This also prevents the stretched-list complaint.
- Pick the 1-pane vs 2-pane layout from the effective width per pane at the current font scale, not the raw window width. At 200% font scale on a Fold (about 600–700dp), list-detail panes of about 300dp would break, so fall back to a single pane.
- On a wide screen the centre + in the bottom bar is hard to reach one-handed. Moving it to the top of a leading-edge rail (or a side FAB) follows Samsung's grip guidance and Android's rail guidance.

### Gaps
- I found no primary NN/g or Baymard article on line length or large-screen forms. Baymard was not reached.
- I found no source quantifying thumb reach zones on unfolded book foldables.
- I found no platform guidance specifically on large-text (font scale) behaviour inside multi-pane layouts. The inference above is mine, not sourced.
