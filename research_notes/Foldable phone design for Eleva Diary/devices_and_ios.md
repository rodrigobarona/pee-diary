# Foldable and dual-screen devices (Nov 2026) and how Apple platforms treat iPhone apps on large/foldable displays

Research date: 19 November 2026. Apple developer pages were read from their JSON/HTML sources the same day. "Rumour" or "dated" labels mark anything that is not a current, primary-source fact.

Context for the reader. The Eleva repo as checked today has these settings. `app.json` sets `"orientation": "portrait"` and `ios.supportsTablet: false`. `ios/ElevaDiary/Info.plist` explicitly sets `UIRequiresFullScreen = false`, and `UISupportedInterfaceOrientations` lists Portrait and PortraitUpsideDown. `TARGETED_DEVICE_FAMILY = 1` (iPhone only) and the deployment target is iOS 16.4. The app uses an AppDelegate only: there is no `UIApplicationSceneManifest` and no SceneDelegate. The local toolchain is Xcode 26.5 (iOS 26 SDK), with Expo SDK 57 and React Native 0.86.3. These are local repo facts, not web sources.

---

## Q1. Which foldable/dual-screen devices matter in November 2026, and their exact display specs

### Takeaway
In Europe in late 2026 the foldables that matter are Samsung's Galaxy Z Fold8, Z Fold8 Ultra and Z Flip8 (announced July 2026), Fold7/Flip7 (2025), Google's Pixel 10 Pro Fold and Pixel 11 Pro Fold, Motorola Razr flips, Honor Magic V-series, and Apple's iPhone Duo (launched 23 Oct 2026). There are two important shape changes. Samsung's standard Fold8 and the iPhone Duo both use a near-4:3 inner panel with a short, wide cover screen, which is a "passport/wide" shape. Fold7, Fold8 Ultra and the Pixel folds keep a nearly square inner panel with a tall 21:9-ish cover screen. Tri-folds (Galaxy Z TriFold, 10") exist but are niche and expensive.

### Cited Findings

**Samsung Galaxy Z Fold7 (July 2025)**
- Inner: 8.0", 1968 × 2184 px, ~368 ppi, 120 Hz, 2600 nits peak — [GSMArena spec page](https://m.gsmarena.com/samsung_galaxy_z_fold7-13826.php); [GSMArena review](https://m.gsmarena.com/samsung_galaxy_z_fold7-review-2856.php)
- Cover: 6.5", 1080 × 2520 px, ~422 ppi, 21:9 — [Notebookcheck](https://www.notebookcheck.net/Samsung-unveils-Galaxy-Z-Fold7-with-larger-displays-new-design-and-enhanced-cameras.1054188.0.html); [GSMArena](https://m.gsmarena.com/samsung_galaxy_z_fold7-13826.php)
- Fold7 sold over a quarter of a million units in Western Europe in its first four weeks (Counterpoint, Sept 2025) — [9to5Google](https://9to5google.com/2025/09/15/galaxy-z-fold-7-europe-report/)

**Samsung Galaxy Z Fold8, Z Fold8 Ultra, Z Flip8 (Galaxy Unpacked, London, 22 July 2026)**
- Samsung unveiled three foldables. The Fold8 Ultra is "the first Ultra model in the Galaxy foldable portfolio". The Fold8 has "an all-new form factor" — [Samsung Global Newsroom, 22 Jul 2026](https://news.samsung.com/global/galaxy-unpacked-july-2026-a-first-look-at-galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8)
- Fold8 (standard): "5.5-inch cover screen and a 7.6-inch main display. Unfolding the device expands the display to a 4:3 aspect ratio … Rotating the device switches to a 3:4 aspect ratio … The cover screen's 10:16 aspect ratio". Weight is 201 g — [Samsung Newsroom](https://news.samsung.com/global/galaxy-unpacked-july-2026-a-first-look-at-galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8)
- Fold8 resolutions: inner 1,848 × 2,448 (403 ppi, 120 Hz) and cover 1,248 × 1,972 (428 ppi). These come from press and community spec pages, not Samsung's newsroom — [CGMagazine](https://www.cgmagonline.com/news/samsung-galaxy-unpacked-fold8-flip8-specs/); [Android Authority leak](https://www.androidauthority.com/samsung-galaxy-z-fold-8-ultra-full-specifications-leak-3687790/)
- Fold8 Ultra: "spacious 8-inch main display", 4.1 mm unfolded, 215 g — [Samsung Newsroom](https://news.samsung.com/global/galaxy-unpacked-july-2026-a-first-look-at-galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8). Its resolution (2504 × 2256 inner; 6.5" 2520 × 1080 cover) comes only from a community wiki and leaks — [Android Fandom wiki](https://android.fandom.com/wiki/Samsung_Galaxy_Z_Fold8); [Android Authority](https://www.androidauthority.com/samsung-galaxy-z-fold-8-ultra-full-specifications-leak-3687790/)
- Flip8: 6.9" main, 2520 × 1080, 120 Hz. FlexWindow cover is 4.1", 1048 × 948, ~342 ppi. 180 g. Note one conflict: Samsung Canada's support page says the main display is 6.7" — [Notebookcheck](https://www.notebookcheck.net/Samsung-Galaxy-Z-Flip8-launches-as-the-thinnest-and-lightest-flip-yet-with-two-120Hz-displays.1347118.0.html); [Samsung Canada support](https://www.samsung.com/ca/support/mobile-devices/galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8-specifications-and-features/); [Samsung Newsroom](https://news.samsung.com/global/galaxy-unpacked-july-2026-a-first-look-at-galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8). On the Flip8, apps can run on the FlexWindow, e.g. "browse photos in the Gallery app, chat with friends through messaging apps" — [Samsung Newsroom](https://news.samsung.com/global/galaxy-unpacked-july-2026-a-first-look-at-galaxy-z-fold8-ultra-galaxy-z-fold8-and-galaxy-z-flip8)

**Google Pixel 10 Pro Fold (Aug 2025, on sale 9 Oct 2025, $1,799)**
- Inner: 8.0", 2076 × 2152, ~373 ppi. Outer: 6.4", 1080 × 2364 — [Android Authority](https://www.androidauthority.com/pixel-10-pro-fold-specs-features-price-availability-3585263); [Google blog](https://blog.google/products/pixel/google-pixel-10-pro-fold/); [TechCrunch](https://techcrunch.com/2025/08/20/google-unveils-its-1799-pixel-10-pro-fold)

**Google Pixel 11 Pro Fold (launched ~13 Aug 2026)**
- Inner: 8.0" Super Actua Flex, 2076 × 2152, 372 ppi. Outer: 6.5" Super Actua, 1080 × 2342, 399 ppi. Both run at 1–120 Hz — [Google Store UK specs](https://store.google.com/gb/product/pixel_11_pro_fold_specs?hl=en-GB); [ProPakistani](https://propakistani.pk/2026/08/13/google-pixel-11-pro-fold-launches-with-bigger-cover-display/); [PhoneArena](https://www.phonearena.com/news/pixel-11-pro-fold-is-here_id182546)

**Apple iPhone Duo (announced Sept 2026; on sale 23 Oct 2026)**
- Inner: 7.6" (7.58" as a rectangle) folding OLED, 1878 × 2670 px at 430 ppi, nano-texture. Outer: 5.4" (5.36"), 1398 × 2034 px at 460 ppi. Both displays have ProMotion up to 120 Hz, Dynamic Island and Apple Pencil (USB-C) support — [Apple iPhone Duo Tech Specs](https://www.apple.com/iphone-duo/specs/); [Apple PT specs](https://www.apple.com/pt/iphone-duo/specs/); [Apple Support tech specs](https://support.apple.com/en-us/148588). Full details are under Q2.

**Galaxy Z TriFold (announced Dec 2025)**
- Main: 10", 2160 × 1584, 120 Hz, 1600 nits. Cover: 6.5", 2520 × 1080, 21:9. US price $2,899 (512 GB) — [GSMArena](https://m.gsmarena.com/samsung_galaxy_z_trifold_5g-14292.php); [TechSpot](https://www.techspot.com/news/110462-samsung-finally-announces-galaxy-z-trifold-us-launch.html); [PhoneArena](https://www.phonearena.com/galaxy-z-trifold-release-date-price-features-news)
- The initial launch excluded Europe. A Gizchina report says it "arrives in Europe, but at a prohibitive price". I could not confirm a date or EU price — [Gizchina](https://en.gizchina.it/?p=638459); [heise](https://heise.de/-11098992)
- Android Developers now has a dedicated guidance page, "Support trifolds and landscape foldables", under Foldables — [Android Developers nav, window size classes page](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)

**Other book foldables (mostly 2025 models; China-first)**
- Honor Magic V5: 7.95" inner, 2172 × 2352. Sold in Europe at €1,999 / £1,699.99 — [GSMArena](https://m.gsmarena.com/honor_magic_v5-13982.php); [Mobile World Live](https://www.mobileworldlive.com/devices/honor-introduces-thinnest-foldable-to-europe/)
- Oppo Find N5: 8.0" inner, 2076 × 2152. vivo X Fold5: 8.03" inner, 2200 × 2480. These are single-source figures and EU availability is unconfirmed — [PhoneArena compare](https://www.phonearena.com/phones/compare/vivo-X-Fold-5,Honor-Magic-V5/phones/12765,12826)
- Huawei Mate X7: 8" inner, 2210 × 2416. Single source; EU availability unconfirmed — [Smartprix](https://us.smartprix.com/mobiles/huawei_mate_x7_vs_honor_magic_v5-cpd1m8m32yit_pd19l779eog.php)

**Microsoft Surface Duo (discontinued)**
- The original Surface Duo reached end of support on 10 Sept 2023, with Android 12L as its last OS — [Pureinfotech](https://pureinfotech.com/microsoft-ends-support-surface-duo/); [MobileSyrup](https://mobilesyrup.com/2023/09/11/original-surface-duo-microsoft-ends-support/)
- Surface Duo 2's final update and end of support came on 21 Oct 2024 — [heise](https://heise.de/-9974707); [Droid Life](https://www.droid-life.com/2024/10/22/surface-duo-2-reaches-end-of-update-road/)
- Apple reused the "Duo" name in 2026 for its own foldable. Its "Split arrangement" and "Overlay arrangement" views, which place panes on each side of a fold, conceptually echo Surface Duo dual-screen patterns. That is an inference from [Apple HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo).

**Android window-size breakpoints (for converting the devices above into layout classes)**
- Compact width is < 600 dp (99.96% of phones in portrait). Medium is 600–839 dp ("most large unfolded inner displays in portrait"). Expanded is 840–1199 dp ("most large unfolded inner displays in landscape are at least expanded width"). Large is 1200–1599 dp and extra-large is ≥ 1600 dp. Compact height is < 480 dp (99.78% of phones in landscape) — [Android Developers: Use window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- Android 16 (API 36) "ignores screen orientation, aspect ratio, and app resizability restrictions" on large screens. Apps can opt out with `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`, but "the Android framework will eliminate the opt-out capability in API level 37. For apps that target API level 37 or higher, orientation, aspect ratio, and resizability restrictions will always be ignored on displays that are at least sw600dp" — [Android Developers: Device compatibility mode](https://developer.android.com/guide/practices/device-compatibility-mode)

**European market**
- In 2024, European foldable shipments grew 37% YoY, and foldables were ~2% of the European smartphone market. Book-style devices drive the market, and Counterpoint projected ~4 million foldables a year in Europe by 2028 — [GSMArena reporting Counterpoint](https://www.gsmarena.com/european_foldable_market_to_keep_growing_into_next_year_fueled_by_new_launches-news-69047.php)
- In Q1 2025, foldables were 1.5% of European smartphone sales, up only 4% YoY. Samsung led with 41%, down from 56% in Q1 2024. Motorola overtook Honor for #2 (Motorola 15%, Honor 13%) — [Counterpoint, 9 Jun 2025](https://counterpointresearch.com/en/insights/europe-foldable-smartphone-market-is-flatlining-but-competition-continues-to-intensify); [GSMArena](https://m.gsmarena.com/foldables_see_lackluster_q1_growth_samsung_still_holds_the_reins-news-68173.php)
- In H1 2025 in Western Europe, the Motorola Razr 60 was the #1 foldable model with a 15% share. Razr 60 and Razr 50 together held ~27%. Counterpoint called it "a broader four-brand race" (Samsung, Honor, Motorola, Google) — [Counterpoint](https://counterpointresearch.com/en/insights/motorola-google-change-conversation-in-western-europe-foldables-market); [heise](https://www.heise.de/en/news/Foldable-market-in-Western-Europe-New-competition-for-Samsung-11056683.html)
- Global 2026 forecast attributed to Counterpoint (Aug 2026): Samsung 38%, Apple 25%, Huawei 22% of foldable shipments. This comes via a secondary aggregator, and an earlier Counterpoint outlook said Samsung 32% — [Axis Intelligence](https://axis-intelligence.com/foldable-phone-market-share/); [BigGo Finance](https://finance.biggo.com/news/7cd9b918-5ddf-475a-93e8-73e2bdab3cbc)

### Inferences
- Foldables are a small slice of EU phones, about 1.5–2% of sales through 2025. The iPhone Duo is likely to lift that share, but no EU-specific 2026 figure was found. For Eleva, foldables are a "don't break, then delight" target rather than a primary one. The bigger near-term driver is the platform rules: Android 16/17 ignoring orientation locks on sw600dp, and iOS 27 resizing (Q3).
- Approximate Android window widths, computed from px and typical density, not from an official source. Fold7 and Pixel Fold inner panels (~2076–2184 px wide) land in medium width when unfolded in portrait and expanded width in landscape, consistent with Android's "most large unfolded inner displays" note. Cover screens (1080 px wide) land in compact width. The Flip8 FlexWindow (1048 × 948 px) is a near-square, very small window, and full apps can run there.
- The Fold8 (4:3 inner, 10:16 cover) and iPhone Duo (≈1.42:1 inner, ≈1.45:1 outer) are "wide" foldables. Their cover screens are much less tall than a normal phone, so vertical space on the Today dashboard (charts) and in modal forms gets scarcer on the cover screen, not just wider.

### Gaps
- No official Samsung per-device dp/density figures were found. The dp values above are inferences. Device-specific dp (e.g. Fold8 inner in dp) should be measured on an emulator or Samsung Remote Test Lab.
- I did not verify Fold8 and Fold8 Ultra resolutions against Samsung's own spec page. The newsroom gives only inches and aspect ratios.
- I did not source Galaxy Z Flip7 and Fold7-era Razr display specs separately. Flip7 is believed to share the 6.9" / 4.1" FlexWindow layout of the Flip8, but that is unverified.
- No 2026 Europe-only foldable market share, and no iPhone Duo EU sales figures, were found.
- TriFold EU launch date and price are unconfirmed.

---

## Q2. Apple's foldable iPhone (iPhone Duo): status, specs, release date, price

### Takeaway
The iPhone Duo is shipping. Apple announced it in September 2026 (Newsroom, 2026/09), opened pre-orders on 16 Oct 2026, and began availability on 23 Oct 2026. It has a 7.6" inner display (1878 × 2670 px, 430 ppi) and a 5.4" outer display (1398 × 2034 px, 460 ppi). The US price starts at $1,999 (256 GB). In the EU it starts around €2,339 (Spain) to €2,399 (Portugal), and in the UK at £1,999. It is a real, launched product, not a rumour.

### Cited Findings
- The newsroom article "Apple unveils iPhone Duo" (Sept 2026) describes a 7.6" inner display that is "50 percent larger than iPhone 18 Pro Max". The 5.4" outer display "delivers 90 percent of the screen area of iPhone 18 Pro". It comes in two colours, star white and night sky, and is made of grade 5 titanium. "Pre-orders begin Friday, October 16, with availability beginning Friday, October 23." — [Apple Newsroom](https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/)
- Tech specs. Inner display: "7.6‑inch (diagonal) all‑screen OLED folding display, 1878‑by‑2670-pixel resolution at 430 ppi". Outer display: "5.4‑inch (diagonal) … 1398‑by‑2034-pixel resolution at 460 ppi". As standard rectangles, the inner measures 7.58" and the outer 5.36". Both displays have the Dynamic Island, Always-On, ProMotion up to 120 Hz, and support for Apple Pencil (USB-C). Other specs: A20 Pro, Touch ID in the side button (no Face ID mentioned), and dual batteries — [Apple iPhone Duo specs](https://www.apple.com/iphone-duo/specs/); [Apple Portugal specs (pt-PT)](https://www.apple.com/pt/iphone-duo/specs/)
- Aspect ratios, computed from Apple's pixel counts: inner 2670/1878 ≈ 1.42:1 and outer 2034/1398 ≈ 1.45:1. Both panels are close to 4:3–3:2, far from the ~2.17:1 of the iPhone 17/18 Pro. Unity's platform team summarises: "Apps designed around roughly 20:9 must support a 4:3 aspect ratio … close to an iPad's aspect ratio" — [Unity Discussions: iPadOS 27 & SDK 27 adaptability changes & iPhone Duo updates](https://discussions.unity.com/t/info-ipados-27-sdk-27-adaptability-changes-iphone-duo-updates/1737980)
- Prices. US: from $1,999 (256 GB) up to $3,199 (2 TB) — [Variety](https://variety.com/2026/digital/news/apple-iphone-duo-18-foldable-price-availability-1236855996/); [Channel Insider](https://www.channelinsider.com/apple/news-apple-iphone-duo-1999-launch/). Portugal: €2,399 / €2,649 / €3,149 / €3,899 (256 GB to 2 TB) — [Portal da Queixa](https://portaldaqueixa.com/news/iphone-duo-iphone-18-precos-novidades); [4gnews](https://4gnews.pt/iphone-duo-oficial/). Spain: €2,339 / €2,589 / €3,089 / €3,839 — [Applesfera](https://www.applesfera.com/iphone/donde-cuando-se-podra-comprar-iphone-duo-espana); [Demócrata](https://www.democrata.es/en/current-events/iphone-duo-price-in-spain-characteristics-and-when-it-goes-on-sale/). UK: from £1,999 — [Expert Reviews](https://www.expertreviews.co.uk/technology/phones/iphone-duo-apple-makes-its-long-awaited-foldable-phone-debut). Germany/Austria: ~€2,300, "minus Siri AI" — [Trending Topics](https://www.trendingtopics.eu/apples-iphone-duo-lands-in-germany-and-austria-at-e2300-minus-siri-ai/)
- The rumoured names "iPhone Fold" and "iPhone Ultra" and the rumoured 7.8"/5.5" sizes were superseded by the official announcement — [Tom's Guide](https://www.tomsguide.com/phones/iphones/iphone-fold-heres-what-the-leaks-and-rumors-say-about-apples-alleged-upcoming-foldable-phone); [MacRumors roundup](https://www.macrumors.com/roundup/iphone-duo/)
- The device has two displays, each with its own front camera. The center hinge "supports a variety of ways to hold and position it" (book, tent, flat) — [Apple HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) (new page dated 9 Sept 2026)
- Apple reportedly says more than 100,000 apps have been built for iPhone Duo, with thousands added daily. This comes via press, and I did not find a primary Apple source — [PhoneArena](https://www.phonearena.com/news/number-of-duo-optimized-apps-grows-every-day_id184634)

### Inferences
- Point sizes, inferred and not confirmed by Apple. At @3x the inner display is ≈ 626 × 890 pt and the outer ≈ 466 × 678 pt. If so, the outer display is ~64 pt wider than an iPhone 17 Pro (402 pt) but ~196 pt shorter (874 pt). The HIG still treats it as compact width. App Store Connect's inner-display screenshot size (2007 × 2853) does not match the 1878 × 2670 panel (see Q5), so the actual rendering scale may differ. Verify in Xcode 27.1 Device Hub before designing to exact pt values.

### Gaps
- No official point dimensions or default scale factor for either Duo display were found. The HIG Layout page's device-spec table appears to have been removed in its 9 Sept 2026 update.
- The official EUR prices come from regional press citing Apple, not from apple.com/pt or apple.com/es store pages directly.
- No Europe sales data for iPhone Duo was found.

---

## Q3. How iOS runs an iPhone-only app on iPhone Duo; new APIs, SDK/Xcode requirements, Info.plist keys

### Takeaway
How an iPhone-only app behaves on the iPhone Duo depends on the SDK it was built with. **Built with the iOS 26 SDK (Eleva today, Xcode 26.5)**, the app runs on the inner display in a legacy compatibility window. It gets "a familiar size and aspect ratio" of an existing iPhone, surrounded by black, so it is effectively letterboxed and not scaled up. On the outer display it uses the area beside the status bar and camera. **Built with the iOS 27.0 SDK**, the app extends further but not edge to edge, and orientation is locked to project settings. **Built with Xcode 27.1 / iOS 27.1 SDK**, the app runs full-screen as a resizable scene. The inner display is regular width, rotates freely like an iPad, and can share the screen side by side with another app; that side-by-side mode cannot be opted out of. Bars move to a vertical side rail in several poses. iOS 27 SDK builds must also adopt the UIScene life cycle or they won't launch. `UIRequiresFullScreen` no longer prevents resizing on iOS 27, only makes it "discrete". Apple will require iPhone Duo screenshots from April 2027 for apps built with the iOS 27.1 SDK or later.

### Cited Findings

**Compatibility modes by SDK**
- Apple, via press: "existing iPhone apps can run on the Duo" without a rebuild. When the device is closed, a legacy app uses the space left of the status bar and camera. When open, iOS shows the app at "a familiar size and aspect ratio", not stretched across the inner display. The iOS 27 SDK lets apps "extend farther across the inner display". The iOS 27.1 SDK (Xcode 27.1) lets apps "extend to the display edges", and standard navigation and toolbars adopt Duo layouts with vertical controls. Apps that declare UIRequiresFullScreen "still resize when the Duo changes physical state". AppleMagazine, 27 Sept 2026, citing developer.apple.com/iphone-duo and tech talks 111461, 111463, 111464 and 111466 — [AppleMagazine](https://applemagazine.com/iphone-duo-app-compatibility/)
- Unity platform team, from simulator observations. **"Full legacy mode (SDK < 27): The window mimics existing iPhone sizes, with black surrounding it. Rotation is limited to allowed orientations, and runtime orientation changes work."** **"Partial legacy mode (SDK 27.0): The window is 240px shorter on the lock-button side, with a black bar beside it. Orientation is locked to the Xcode project settings."** With SDK 27.1 and UIRequiresFullScreen enabled, "Orientation locks work, and the app is letterboxed when the device orientation doesn't match an allowed orientation." — [Unity Discussions](https://discussions.unity.com/t/info-ipados-27-sdk-27-adaptability-changes-iphone-duo-updates/1737980)
- Unity also says that on the **outside screen** "apps behave like regular iPhone apps. Orientation locks work as expected." On the **inside screen**, apps "behave like iPad apps. They can rotate freely and run side by side." There is "no way to opt out of side by side functionality". Safe areas differ by screen: outside excludes the bottom (home bar) and the selfie-camera side; inside excludes only the bottom — [Unity Discussions](https://discussions.unity.com/t/info-ipados-27-sdk-27-adaptability-changes-iphone-duo-updates/1737980)
- Users of new iPhone Duos have complained about "the app situation" as unoptimised apps "suffer from letterboxing". This is a headline only; the page returned 403 — [The Mac Observer](https://www.macobserver.com/news/new-iphone-duo-owners-slam-the-app-situation-as-unoptimised-apps-suffer-from-letterboxing/)

**Apple developer hub and APIs**
- Apple's developer hub says: "Xcode 27.1. Get the latest SDKs to build, run, and test your app for iPhone Duo." and "Learn how to build and update your app to dynamically resize and adjust its layouts for iPhone Duo". It lists tech talks 111466 (Design for iPhone Duo), 111461 (Prepare your app), 111462, 111463 (adaptive layouts), 111464 (multiple displays and scenes) and 111465 (camera). It also mentions a "Made for iPhone Duo" App Store badge — [developer.apple.com/iphone-duo](https://developer.apple.com/iphone-duo/)
- New layout APIs named in the HIG:
  - `ReservedRegion` (SwiftUI/UIKit), for the outer camera, inner camera when active, and the folding region.
  - `ArrangementView` / `UIArrangementViewController`, as split or overlay arrangements.
  - `ToolbarItemVisibilityPriority` / `UIBarButtonItemVisibilityPriority`.
  - `ToolbarVerticalCompressionBehavior` / `UIVerticalBarCompressionBehavior`.
  - `ToolbarOverflowMenu` / `additionalOverflowItems`.

  Source: [Apple HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Device Hub in Xcode (27.1 beta) simulates open, close, rotate and fold poses — [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo); [AppleMagazine](https://applemagazine.com/iphone-duo-app-compatibility/)
- Apple advises against relying on `UIScreen.main`; derive geometry from the window scene, traits or view geometry instead — [AppleMagazine](https://applemagazine.com/iphone-duo-app-compatibility/). WWDC26 session 278, "Modernize your UIKit app", says "`UIScreen.main` and screen bounds are no longer reliable" and "Orientation is no longer reliable either" — [Fatbobman, 17 Jun 2026](https://fatbobman.com/en/posts/from-size-class-to-available-space/)

**UIRequiresFullScreen and resizing (TN3192, last revised 9 Oct 2026)**
- "Prior to iOS 27, this key-value pair configures iPadOS apps only, and is ignored for iOS apps." and "Starting in iPadOS 26, `UIRequiresFullScreen` and its associated compatibility mode are deprecated and will be ignored in a future release." — [Apple TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)
- "Starting in iOS 27 and iPadOS 27, `UIRequiresFullScreen` no longer opts your app out of resizing on either platform. Instead, the system resizes your app's scene discretely. This behavior applies when you build your app with the iOS 27 SDK or later and set `UIRequiresFullScreen` to `YES`, unless `UIRequiresFullScreenIgnoredStartingWithVersion` specifies version 27 or earlier." A discrete resize keeps the scene the same size while the window is dragged, then moves it to a `UIScreen` of exactly the new size. Discrete resizing is covered in WWDC26 session 278 — [Apple TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)
- TN3192's checklist for resizable scenes: provide a launch screen ("Starting in iOS 27 and iPadOS 27, a launch screen is required for App Store submission", see TN3208); "Supports all" adaptability/orientations (the link text is truncated in the JSON source); and don't include `UIRequiresFullScreen`. Even with resizing, "On iPhone models without a Home button, the system excludes `portraitUpsideDown` from the supported set regardless of what your app declares." — [Apple TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)
- Recommended replacements:
  - `UISceneSizeRestrictions` for a preferred minimum size. Apple's example is 500 pt minimum width. It "does not prohibit other resizing behavior like rotation".
  - `prefersInterfaceOrientationLocked` plus `setNeedsUpdateOfSupportedInterfaceOrientations()`. "The system does not guarantee that the `prefersInterfaceOrientationLocked` preference will be honored".
  - `windowScene(_:didUpdateEffectiveGeometry:)` and `isInteractivelyResizing` in UIKit, and `windowResizability(_:)` and `onInteractiveResizeChange(_:)` in SwiftUI.
  - `registerForTraitChanges` for size-class changes.

  Source: [Apple TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)
- Apple DTS on forums: the system makes "a best effort" to satisfy a minimum scene size, but it is "not guaranteed" — [Apple Developer Forums thread 802069](https://developer.apple.com/forums/thread/802069)

**UIScene life cycle requirement**
- TN3187 says the UIScene life cycle "will be required when building with the latest SDK; otherwise, your app won't launch". iOS 27 SDK builds reportedly stop with "UIScene life cycle is required for apps built with this SDK". Binaries already shipped with older SDKs still launch on iOS 27 — [Apple Developer Forums thread 812487](https://developer.apple.com/forums/thread/812487); [Classmethod: Xcode 27 / iOS 27 beta release notes](https://dev.classmethod.jp/en/articles/xcode-27-ios-27-beta-release-notes/); [Flutter breaking-change doc](https://docs.flutter.dev/release/breaking-changes/uiscenedelegate.md)

**SDK deadlines**
- Apple's current published requirement: "Since April 28, 2026, apps uploaded to App Store Connect must be built with Xcode 26 or later using an SDK for iOS 26". No iOS 27 SDK deadline was posted there as of 19 Nov 2026 — [Apple Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)
- Unity "expects" Apple to require SDK 27 builds by late April 2027. Apps built with SDK 26 and `UIRequiresFullScreen=true` "can be published until SDK 27 is required" — [Unity Discussions](https://discussions.unity.com/t/info-ipados-27-sdk-27-adaptability-changes-iphone-duo-updates/1737980)
- App Store Connect: "Starting in April 2027, screenshots will be required for any app using the iOS 27.1 SDK or later" (iPhone Duo screenshots) — [App Store Connect: Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

**App Review Guidelines**
- The guidelines were last updated 16 Oct 2026. They contain no iPhone Duo-specific rule. 2.4.1 still reads: "To ensure people get the most out of your app, iPhone apps should run on iPad whenever possible." — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Inferences
- **Eleva today.** The app is built with Xcode 26.5, has no scene manifest, is portrait-only and iPhone-only. On iPhone Duo it will appear in the "full legacy" window on the inner display (iPhone-sized with black surround) and in a narrowed area on the outer display. It still works, but it looks unoptimised, which is the scenario users are complaining about.
- **The moment Eleva moves to the iOS 27 SDK**, whether through a future Expo SDK and RN release on Xcode 27, or forced by an April 2027 requirement, several things change together:
  - (a) The app must use the UIScene life cycle. Today's AppDelegate-only template will need the scene-delegate support of whatever Expo/RN version adopts it.
  - (b) On the Duo inner display, a 27.1 build will be resizable, rotatable and side-by-side capable, and a portrait-only lock may be letterboxed or not honoured.
  - (c) Duo screenshots become required for 27.1+ builds.

  Designing the Today, History and Settings screens to reflow by available width, not by device type or orientation, is therefore a compliance item as well as a UX one.
- The `PortraitUpsideDown` entry in Info.plist has no effect on Face ID/Touch-ID-side-button iPhones (TN3192). It is harmless, but it can be dropped.
- For React Native, the HIG advice "determine layout based on size classes, not device type or orientation" maps to `useWindowDimensions()` width breakpoints. RN has no direct size-class API, so an inferred threshold near iPad and Android medium widths (~600 pt/dp) is a reasonable proxy. It is not an Apple-specified number.

### Gaps
- I did not find Apple's primary page describing the legacy-mode window size on the Duo inner display; the "Preparing your app for iPhone Duo" doc did not load. Exact letterbox dimensions (which iPhone size it mimics) are unconfirmed. The descriptions above come from AppleMagazine and Unity simulator observations.
- I found no Apple statement on whether the inner display reports regular width while a 27.1 app runs in side-by-side Split View on the Duo. The HIG implies split views collapse "the same way it adapts between regular and compact environments".
- I did not confirm an official date for an iOS 27 SDK submission requirement. "April 2027" comes from Unity and Japanese sources and from the screenshot note.
- Whether React Native or Expo (SDK 57/58) already supports UIScene life cycle, `ReservedRegion` or vertical bars is out of scope here and should be checked.

---

## Q4. Apple HIG for layout across size classes, iPad layout, readable width, split views/sidebars, foldable-specific guidance

### Takeaway
The HIG (Layout, updated 9 Sept 2026) says to lay out by **size class and available space, never by device type or orientation**, to keep functionality identical across sizes, and to use extra width to show more. For example, switch a tab bar to a sidebar, or show an extra level of hierarchy. The new "Designing for iPhone Duo" page (9 Sept 2026) gives these rules:
- Use a compact-width layout on the outer display and regular width on the inner.
- Don't reinvent the app on resize.
- Use split views that collapse to one pane when folded.
- Use even-numbered grid columns so content divides at the fold.
- Accept vertical side-rail toolbars and tab bars.
- Keep controls clear of reserved regions.

### Cited Findings

**HIG: Layout (updated 9 Sept 2026)**
- "Determine layout based on size classes, not device type or orientation. Size classes describe the actual space available … a device's orientation and type (also called its idiom) aren't useful for making layout decisions" — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- "Consider all possible combinations of size classes … designing exclusively for compact portrait could leave extra space when someone resizes the app window to a regular width on iPad." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- "Keep functionality the same as size classes change … you can change the amount of functionality that's visible onscreen … Consider taking advantage of larger spaces to switch from a tab bar to a sidebar or expose functionality that might otherwise be grouped into an overflow menu." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- "Even if your app is locked to a certain orientation … it's still important to ensure your interface resizes well to provide the best experience across devices and window sizes." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Layout guides "restrict the width of text for optimal readability" (readable content guide). Respect safe areas for the Dynamic Island, toolbars and tab bars. Support Dynamic Type by stacking horizontally adjacent views vertically at large sizes — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- "Preview your app on multiple devices, using different size classes, localizations, and text sizes … test on a simulated device in Device Hub" — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Change log: "September 9, 2026 — Updated guidance to reflect current best practices". The per-device specifications table no longer appears in the page body — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)

**HIG: Designing for iPhone Duo (new, 9 Sept 2026)**
- "Although iPhone Duo is a new form factor … you're still designing for iPhone, and iOS patterns and best practices still apply." — [HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Device poses: "A compact width layout for the outer display and a regular width layout for the inner display give you the fundamentals for every pose. Don't reinvent your app when it resizes; allow the existing layout to expand based on the available space instead." — [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Best practices:
  - "Build your app to resize … Avoid fixed widths and display-specific dependencies."
  - "Create a consistent experience across displays … show an additional level of hierarchy on the larger inner display". Mail is the example: a list when closed, list plus email side by side when open.
  - "Maintain the same functionality across device poses."

  Source: [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Reserved regions: the outer camera (always present), the inner camera (when active), and the folding region (when partially open). "Components like alerts, context menus, and sheets automatically move to account for the fold". "In a grid-style layout, prefer an even number of columns so content divides cleanly". "Avoid extreme layout changes as people fold the device." — [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Split views: "a split view expands on the inner display and collapses to a single pane on the outer display, the same way it adapts between regular and compact environments". With standard components they adapt their width to the fold automatically — [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Arrangement views. A split arrangement divides horizontally when wider than tall and vertically when taller than wide. An overlay arrangement moves its two views to each side when partially folded. "A layout that places two views side by side or one above the other, such as an HStack or VStack, translates directly to a split arrangement". "Keep navigation outside of arrangement views." — [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Vertical controls: "toolbars, tab bars, and navigation controls that are typically at the top and bottom of the display move to the side … The exception is the inner display in portrait". In side-by-side Split View, "each one places controls along its outer edge". Controls "stay on the same side in right-to-left languages". Other rules:
  - Reserve the top of the rail for Back/Close, then prominent actions like Done.
  - Give every toolbar item both a title and a symbol.
  - Keep text-only buttons to a minimum, because they "stay in a horizontal bar".
  - "In general, don't override the default bar placement".
  - In task-oriented experiences, minimise the tab bar so the toolbar is preserved.

  Source: [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Games or locked layouts: "You can choose to lock to either portrait or landscape orientation, but be sure to fill the screen as the device pose changes … Prefer changing the aspect ratio over letterboxing or pillarboxing" — [same](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)

**Size-class reliability (developer commentary)**
- `horizontalSizeClass` is "the system's coarse-grained contextual judgment … not a continuous width sensor". An iPhone-idiom app made wider can stay `compact`, so layout breakpoints should use available view or scene size — [Fatbobman, 17 Jun 2026](https://fatbobman.com/en/posts/from-size-class-to-available-space/)

### Inferences
- For Eleva, this guidance maps onto existing screens:
  - **History**, a calendar plus list, is a natural list/detail split view when regular width and a single pane when compact. The calendar pairs with the day list, mirroring the HIG Mail example.
  - **Today**, the dashboard with charts, can expand into a two-column card grid. Use an even column count so the fold divides it cleanly.
  - **Modal forms and sheets** are system-adapted around the fold. Custom bottom sheets in RN, such as Gorhom or custom modals, are not system components and will not move automatically; they need a manual check against the fold and reserved regions.
  - **Settings** stays a single readable-width column.
- Because RN tab bars and headers (react-navigation / expo-router) are not native `UITabBar`/`UIToolbar` unless native tabs are used, the Duo's automatic vertical side rail may not apply to Eleva's bars. Native-tabs support should be checked, since it decides whether Eleva "receives this layout automatically".

### Gaps
- The HIG page body did not show a numeric readable content width (pt). The readable content guide is system-computed.
- No HIG point thresholds for when size classes flip on the Duo inner display were found.
- The WWDC26 and tech-talk session contents (111461–111466, session 278) were not transcribed.

---

## Q5. iPhone-only apps on iPad today, and the App Store cost of enabling `supportsTablet`

### Takeaway
With `supportsTablet: false` (TARGETED_DEVICE_FAMILY = 1), Eleva already runs on iPads as an iPhone app in compatibility mode. As of iPadOS 26, such apps reportedly sit in a resizable window environment but keep the phone idiom and compact size class. Enabling `supportsTablet` makes it an iPad app, with these obligations:
- At least one 13-inch iPad screenshot (2064 × 2752 or 2048 × 2732) per localization.
- Full iPadOS 26/27 multitasking and resizing. `UIRequiresFullScreen` is deprecated and ignored under the iOS 27 SDK.
- In practice, all orientations on iPad.

The App Review Guidelines only encourage iPad support (2.4.1, "should run on iPad whenever possible"); they don't require it.

### Cited Findings
- Expo: `ios.supportsTablet` means "Whether your standalone iOS app supports tablet screen sizes. Defaults to false". `ios.requireFullScreen` (which maps to `UIRequiresFullScreen`) "indicates that your standalone iOS app does not support Slide Over and Split View on iPad. Defaults to false" — [Expo app config docs](https://docs.expo.dev/versions/latest/config/app/)
- `UIRequiresFullScreen` doc: in iPadOS 26+ (Windowed Apps) or with Stage Manager, compatibility mode "Maintains a consistent scene size for your app, but doesn't present your app's scene full screen". It "Scales your app's presentation when the user resizes it, rather than changing the size of your app's scene" and "doesn't visually rotate your scene". "In iPadOS 26 and later, support multitasking and dynamic resizing to make your iPad app flexible." — [Apple: UIRequiresFullScreen](https://developer.apple.com/documentation/bundleresources/information-property-list/uirequiresfullscreen)
- Starting with WWDC26, "iPhone-only apps running on iPad will also enter a resizable environment". The author's iPhone-only app on iPad kept `horizontalSizeClass` = `compact`, and `NavigationSplitView` did not go multi-column. Session 278 says "phone idiom is no longer equivalent to a narrow-screen layout" — [Fatbobman, 17 Jun 2026](https://fatbobman.com/en/posts/from-size-class-to-available-space/)
- A user report says iPhone apps showed in a fixed-size window on iPadOS 15–18, while iPadOS 26 allows resizable windows and some older iPhone apps "behave unpredictably". Full Screen Apps mode is suggested as a workaround — [Apple Community thread](https://discussions.apple.com/thread/256242802)
- iPadOS 26 offers Full Screen Apps, Windowed Apps and Stage Manager multitasking modes — [Fatbobman](https://fatbobman.com/en/posts/from-size-class-to-available-space/); [Apple iPadOS 26 All New Features PDF](https://images.apple.com/ph/os/pdf/All_New_Features_iPadOS_26_Sept_2025.pdf)
- Under SDK 27 on iPadOS 27, apps are "automatically opted into dynamic orientation and resizing, including Split View and Stage Manager. The compatibility layer is unavailable." With UIRequiresFullScreen enabled, windows are freely resizable and the app may render "on its side or upside down" if the iPad orientation is not allowed (undocumented) — [Unity Discussions](https://discussions.unity.com/t/info-ipados-27-sdk-27-adaptability-changes-iphone-duo-updates/1737980)
- App Store Connect required screenshot sizes:
  - iPhone: "At least one screenshot for iPhone with Dynamic Island (medium display)", i.e. 1179 × 2556 or 1206 × 2622 portrait.
  - iPad (if your app supports iPadOS): "At least one screenshot for iPad 13-inch display", i.e. 2064 × 2752 or 2048 × 2732 portrait, "Required if app runs on iPad".
  - Smaller sizes are auto-scaled from the highest provided.
  - iPhone Duo: outer display 1398 × 2034 (or 2034 × 1398), inner display 2007 × 2853 (or 2853 × 2007). "Starting in April 2027, screenshots will be required for any app using the iOS 27.1 SDK or later". "When you submit iPhone Duo screenshots … your App Store product page will display a badge to let people know your app is made for iPhone Duo."

  Source: [App Store Connect: Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- App Review Guideline 2.4.1 (guidelines updated 16 Oct 2026): "iPhone apps should run on iPad whenever possible. We encourage you to consider building apps so customers can use them on all of their devices." — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Third-party write-ups describe 2.4.1 rejections when iPhone apps break in iPad compatibility mode — [AppSubmitter](https://www.appsubmitter.io/app-rejection-guides/app-store-guideline-2-4-1-ipad-compatibility/)

### Inferences
- **Store screenshot workload.** Today Eleva needs only iPhone screenshots × 3 locales (en-GB, pt-PT, es-ES). Turning on `supportsTablet` adds a 13" iPad set × 3 locales. Moving to the iOS 27.1 SDK adds iPhone Duo outer and inner sets × 3 locales from April 2027. The Duo badge is a small marketing incentive to do the latter.
- **Duo work comes first.** Even without `supportsTablet`, the work needed for the Duo inner display (regular width, rotation, side-by-side) is most of the work needed for a good iPad layout. A single width-driven responsive layout serves the Duo inner display, iPad and Android book foldables, which makes enabling `supportsTablet` cheap afterwards apart from screenshots.
- **Keep the iPad build working.** Eleva's iPhone build already reaches iPad users. It should be tested in iPadOS 26 Windowed Apps mode so it doesn't break (Guideline 2.4.1 risk), especially portrait-only layouts in a resizable window.

### Gaps
- No Apple primary doc spells out iPhone-only app behaviour on iPadOS 26/27 (window sizes, scaling factor, whether rotation is honoured). The findings above are from developer blogs, forums and Unity.
- Whether a `supportsTablet: true` app must support all four orientations on iPad under iPadOS 26/27 was not confirmed verbatim. TN3192's "Supports all …" line was truncated in the source.
- The inner-display screenshot size (2007 × 2853) conflicts with the inner panel spec (1878 × 2670 px). The cause is unknown; it may be a different render scale. This should be verified in App Store Connect and Device Hub before producing assets.
