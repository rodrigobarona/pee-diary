# Eleva Diary — App Store Assets Checklist

> **Last updated:** February 2026  
> **Purpose:** Track required visual assets and URLs for Apple App Store and Google Play submissions

---

## Required URLs

| URL Type                        | URL                                | Status     |
| ------------------------------- | ---------------------------------- | ---------- |
| Privacy Policy                  | https://eleva.care/privacy         | ⬜ Publish |
| Terms of Use                    | https://eleva.care/terms           | ⬜ Publish |
| Privacy Choices / Data Deletion | https://eleva.care/privacy-choices | ⬜ Publish |
| Support / Contact               | https://eleva.care/support         | ⬜ Publish |
| Marketing / Product Page        | https://eleva.care/diary           | ⬜ Publish |

**Notes:**

- All URLs must be publicly accessible (no login required)
- Privacy Policy is required by both Apple and Google
- Google requires a data deletion method disclosure

---

## Apple App Store Assets

### App Icon

| Requirement | Specification                      |
| ----------- | ---------------------------------- |
| Size        | 1024 × 1024 px                     |
| Format      | PNG (no alpha)                     |
| Shape       | Square (iOS applies corner radius) |
| File        | `assets/images/icon.png`           |

### Screenshots (Required)

Screenshots must show actual app UI. Do not use mockups with excessive device frames.

#### iPhone Screenshots

| Device                   | Required Sizes | Quantity |
| ------------------------ | -------------- | -------- |
| 6.7" (iPhone 15 Pro Max) | 1290 × 2796 px | 3-10     |
| 6.5" (iPhone 11 Pro Max) | 1284 × 2778 px | 3-10     |
| 5.5" (iPhone 8 Plus)     | 1242 × 2208 px | 3-10     |

#### iPad Screenshots (If supporting iPad)

| Device         | Required Sizes | Quantity |
| -------------- | -------------- | -------- |
| 12.9" iPad Pro | 2048 × 2732 px | 3-10     |

#### Recommended Screenshot Content

1. **Home screen** — Daily progress, streak badge, insights
2. **Add entry** — Urination/fluid/leak entry form
3. **History** — Calendar view with entries
4. **Charts** — Weekly or monthly visualization
5. **Export** — PDF report preview or export options
6. **Settings** — Language selection, backup options

#### Screenshot Text Overlay (Localized)

If adding text overlays, localize for each language:

**English:**

- "Track your bladder health"
- "Log urination, fluids & leaks"
- "Visualize your patterns"
- "Export reports for your doctor"
- "Privacy first — all data stays on device"

**Spanish:**

- "Controla tu salud vesical"
- "Registra micciones, líquidos y pérdidas"
- "Visualiza tus patrones"
- "Exporta informes para tu médico"
- "Privacidad primero — todos los datos en tu dispositivo"

**Portuguese:**

- "Acompanhe sua saúde da bexiga"
- "Registre micções, líquidos e perdas"
- "Visualize seus padrões"
- "Exporte relatórios para seu médico"
- "Privacidade em primeiro lugar — dados no seu dispositivo"

### App Preview Video (Optional)

| Specification | Value                       |
| ------------- | --------------------------- |
| Duration      | 15-30 seconds               |
| Format        | H.264, .mov or .mp4         |
| Resolution    | Match screenshot sizes      |
| Audio         | Optional, keep professional |

**Suggested content:**

- Quick demo of adding an entry
- Scrolling through history
- Viewing charts
- Exporting a PDF

---

## Google Play Store Assets

### App Icon

| Requirement | Specification                     |
| ----------- | --------------------------------- |
| Size        | 512 × 512 px                      |
| Format      | PNG (32-bit with alpha)           |
| File        | `assets/images/icon.png` (scaled) |

### Feature Graphic (Required)

| Specification | Value                         |
| ------------- | ----------------------------- |
| Size          | 1024 × 500 px                 |
| Format        | PNG or JPEG                   |
| Content       | App name, tagline, key visual |

**Design suggestions:**

- Clean, minimal design
- App icon prominently displayed
- Tagline: "Your private bladder diary"
- Avoid excessive text

### Screenshots (Required)

| Device Type  | Size                 | Quantity       |
| ------------ | -------------------- | -------------- |
| Phone        | 1080 × 1920 px (min) | 2-8            |
| Tablet (7")  | 1080 × 1920 px       | 1-8 (optional) |
| Tablet (10") | 1920 × 1200 px       | 1-8 (optional) |

**Notes:**

- Screenshots must be 16:9 or 9:16 aspect ratio
- Same content recommendations as Apple screenshots
- Localize text overlays for EN/ES/PT

### Promo Video (Optional)

| Specification | Value                       |
| ------------- | --------------------------- |
| Format        | YouTube URL                 |
| Duration      | 30 seconds - 2 minutes      |
| Content       | App demo, not advertisement |

---

## Asset Production Checklist

### Icons

- [ ] App icon 1024×1024 (Apple)
- [ ] App icon 512×512 (Google)
- [ ] Adaptive icon foreground (Android)
- [ ] Adaptive icon background (Android)
- [ ] Monochrome icon (Android 13+)

### Screenshots

- [ ] iPhone 6.7" screenshots (EN/ES/PT)
- [ ] iPhone 6.5" screenshots (EN/ES/PT)
- [ ] iPhone 5.5" screenshots (EN/ES/PT)
- [ ] Android phone screenshots (EN/ES/PT)
- [ ] iPad screenshots (optional)
- [ ] Android tablet screenshots (optional)

### Graphics

- [ ] Google Play feature graphic (EN/ES/PT)

### Videos (Optional)

- [ ] Apple App Preview
- [ ] Google Play promo video (YouTube)

---

## Screenshot Scenes to Capture

Capture these screens in each supported language:

| Scene               | Description        | Shows                       |
| ------------------- | ------------------ | --------------------------- |
| 1. Onboarding/Home  | First impression   | Progress rings, daily stats |
| 2. Add Urination    | Core feature       | Volume, urgency selectors   |
| 3. Add Fluid        | Core feature       | Drink type, amount picker   |
| 4. Calendar History | Data visualization | Calendar with entry dots    |
| 5. Entry Detail     | Data depth         | Full entry with notes       |
| 6. Weekly Chart     | Insights           | Bar chart trends            |
| 7. Export           | Sharing capability | Format selection, preview   |
| 8. Settings         | Customization      | Language, backup, goals     |

---

## Best Practices

### Do's

✅ Use actual app screenshots (real data or demo data)
✅ Show the app in context (what users will actually see)
✅ Use high contrast, readable text overlays
✅ Maintain consistent style across all screenshots
✅ Localize all text (app UI + overlays)
✅ Test screenshots on actual devices for clarity

### Don'ts

❌ Don't use fake testimonials or ratings
❌ Don't include misleading performance claims
❌ Don't show features not in the current version
❌ Don't use competitor names or logos
❌ Don't include excessive device frames (keep focus on app)
❌ Don't use low-resolution or blurry images

---

## Tools for Screenshot Creation

- **Figma**: Design overlays and frames
- **Screenshots Pro**: Device frames and text overlays
- **fastlane snapshot**: Automate iOS screenshots
- **fastlane screengrab**: Automate Android screenshots
- **App Screenshot Maker**: Quick mockups

---

## Pre-Submission Checklist

### Apple App Store

- [ ] All required screenshot sizes uploaded
- [ ] Screenshots localized for EN/ES/PT
- [ ] App icon meets guidelines
- [ ] App Preview uploaded (optional)
- [ ] Privacy Policy URL accessible
- [ ] Support URL accessible
- [ ] App Privacy details completed
- [ ] Age rating questionnaire completed

### Google Play Store

- [ ] Feature graphic uploaded (EN/ES/PT)
- [ ] Phone screenshots uploaded (EN/ES/PT)
- [ ] App icon uploaded
- [ ] Privacy Policy URL accessible
- [ ] Data Safety form completed
- [ ] Health apps declaration completed
- [ ] Content rating questionnaire completed
- [ ] Target audience and content set

---

## File Organization

Suggested folder structure for assets:

```
assets/
├── store/
│   ├── apple/
│   │   ├── icon-1024.png
│   │   ├── screenshots/
│   │   │   ├── en/
│   │   │   │   ├── 6.7-inch/
│   │   │   │   ├── 6.5-inch/
│   │   │   │   └── 5.5-inch/
│   │   │   ├── es/
│   │   │   └── pt/
│   │   └── preview/
│   └── google/
│       ├── icon-512.png
│       ├── feature-graphic/
│       │   ├── en.png
│       │   ├── es.png
│       │   └── pt.png
│       └── screenshots/
│           ├── en/
│           ├── es/
│           └── pt/
```
