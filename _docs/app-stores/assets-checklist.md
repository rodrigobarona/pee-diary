# Eleva Diary — App Store Assets and Setup Checklist

> **Last updated:** 11 November 2026
> **Purpose:** The pages, addresses, visual assets and settings needed before submitting to the Apple App Store and Google Play.

---

## Pages to publish

All pages must be public (no login), not geofenced, not PDFs, and available in English, Spanish and Portuguese (pt-PT). Both stores check that the privacy policy URL works.

| Page | URL | Used for | Status |
| ---- | --- | -------- | ------ |
| Home page | https://diary.eleva.care | App Store Marketing URL; Google Play website | ✅ Live |
| Privacy Policy | https://diary.eleva.care/privacy | Both stores' privacy policy field; Settings > Privacy Policy | ✅ Live |
| Terms of Use | https://diary.eleva.care/terms | Settings > Terms of Use; onboarding acceptance | ✅ Live |
| Privacy Choices | https://diary.eleva.care/privacy-choices | Google Play optional data deletion link; Settings > Privacy Choices | ✅ Live |
| Support | https://diary.eleva.care/en/support (/pt/support, /es/support) | App Store Support URL | ✅ Live |

Each page is published in Portuguese, English and Spanish at a language path (for example https://diary.eleva.care/pt/privacy or https://diary.eleva.care/en/terms); the addresses without a language redirect by the browser's language. The app opens the page in its own language. The site is hosted on Vercel (Eleva team account).

What each page must contain:

- **Home page:** the same neutral description as the store listings (a personal bladder diary to keep a record and share it with a health professional), the medical disclaimer, support@eleva.care, the company identification (BÚZIOS E TARTARUGAS - LDA, brand Eleva.care, NIPC 515001708, Rua Gil Vicente 2, 2775-198 Parede, Portugal) and links to the three legal pages. No named conditions, "insights", "trends" or health-benefit claims.
- **Privacy Choices:** how to export, back up and delete the diary, how to deal with device backups, and support@eleva.care for anything else (it doubles as the App Store Support URL).
- **Privacy Policy / Terms of Use:** the texts in the website repo (see `_docs/legal-moved.md`), with "Last updated: 11 November 2026".
- **The site itself:** no cookies, analytics, tracking, forms, or third-party scripts or fonts. Vercel's request logs (IP address, user agent, URL, time; kept up to 30 days) and the short-lived security cookie Vercel may set only when its attack protection challenges a visitor are disclosed in privacy policy §11.3. Adding analytics, non-essential cookies, forms or third-party scripts or fonts requires updating the privacy policy first, and consent for anything not strictly necessary.

## Email addresses to set up

| Address | Purpose | Where it appears |
| ------- | ------- | ---------------- |
| support@eleva.care | Support and general questions; store contact; App Review contact | Store listings, review notes, release notes, home page, legal texts |
| privacy@eleva.care | Data protection requests (until the DPO is appointed, and after) | Privacy Policy, Privacy Choices |
| legal@eleva.care | Legal notices and complaints | Terms of Use, Privacy Policy |

Each mailbox must be monitored. Do not use diary@eleva.care or dpo@eleva.care anywhere.

## Store-account settings

- [ ] Apple: EU Digital Services Act trader status declared, with address, email (support@eleva.care) and a company phone number
- [ ] Google: EU Digital Services Act trader status declared, with the same details
- [ ] Apple: App Review contact name and phone number entered
- [ ] Apple: regulated medical device declaration "No" for every region (`apple/metadata.en.md`)
- [ ] Apple: App Privacy "Data Not Collected" (`apple/app-privacy-answers.md`)
- [ ] Google: Data safety "No data collected / No data shared" (`google/data-safety-answers.md`)
- [ ] Google: Health apps declaration "Health and fitness" (`google/health-apps-declaration-notes.md`)
- [ ] Both: availability limited to EU/EEA countries (owner to confirm the list)

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

Screenshots must show the actual app UI of the build being submitted.

#### iPhone Screenshots

| Device                              | Size           | Quantity        |
| ----------------------------------- | -------------- | --------------- |
| 6.9" (iPhone 17 Pro Max)            | 1320 × 2868 px | 3-10 (required) |
| 6.5" (scaled from 6.9" by Apple)    | 1284 × 2778 px | optional        |

App Store Connect scales the 6.9" set down to every smaller iPhone; the 5.5" set is no longer required. Capture with `e2e/walkthrough/run.sh ios <iPhone 17 Pro Max UDID>`; then `python3 e2e/walkthrough/store-screenshots.py` writes the store files to `store-screenshots/` (captions from the overlay lines below).

#### iPad

`app.json` sets `supportsTablet: false`, so no iPad screenshots. The app still runs on iPad in iPhone compatibility mode and App Review may test it there: check onboarding, the add sheets and the share sheet on an iPad simulator before submitting.

#### What screenshots must not show

- The old Fluid Balance ratio, "Normal range / Low output / High output" or traffic-light colours
- Green/red trend arrows
- Any "medical guidelines" goal text
- The old app name "Pee Diary"
- Real personal data: use demo entries

#### Recommended Screenshot Content

1. **Today** — daily totals, streak
2. **Add entry** — bathroom visit, drink or leak form
3. **History** — calendar with entries
4. **Charts** — weekly or monthly chart of what was logged, with the disclaimer line under it
5. **Export** — PDF report preview or export options
6. **Settings** — language, Local Backup, Reminders, Medical information

#### Screenshot Text Overlays (localised)

**English:**

- "Your private bladder diary"
- "Log bathroom visits, drinks and leaks"
- "Daily totals and simple charts"
- "Export a report for your health professional"
- "Kept on your phone. No account."

**Spanish (Spain):**

- "Tu diario miccional privado"
- "Apunta idas al baño, bebidas y pérdidas"
- "Totales diarios y gráficos sencillos"
- "Exporta un informe para tu profesional de la salud"
- "Guardado en tu móvil. Sin cuenta."

**Portuguese (Portugal):**

- "O seu diário miccional privado"
- "Registe idas à casa de banho, bebidas e perdas"
- "Totais diários e gráficos simples"
- "Exporte um relatório para o seu profissional de saúde"
- "Guardado no seu telemóvel. Sem conta."

### App Preview Video (Optional)

| Specification | Value                       |
| ------------- | --------------------------- |
| Duration      | 15-30 seconds               |
| Format        | H.264, .mov or .mp4         |
| Resolution    | Match screenshot sizes      |
| Audio         | Optional                    |

Suggested content: adding an entry, scrolling through history, viewing the charts, exporting a PDF.

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

- Clean, minimal design with the app icon
- Tagline: "Your private bladder diary" / "Tu diario miccional privado" / "O seu diário miccional privado"
- Little text

### Screenshots (Required)

| Device Type  | Size                 | Quantity       |
| ------------ | -------------------- | -------------- |
| Phone        | 1080 × 1920 px       | 4-8            |
| Tablet (7")  | 1080 × 1920 px       | 1-8 (optional) |
| Tablet (10") | 1920 × 1200 px       | 1-8 (optional) |

- Each side 320-3840 px and the long side at most twice the short side: a raw 1080 × 2424 capture is rejected. Use 9:16 (1080 × 1920); at least 4 screenshots of 1080 px or more make the app eligible for featuring.
- Same content rules and overlays as the Apple screenshots

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

- [ ] iPhone 6.9" screenshots (EN/ES/PT)
- [ ] Android phone screenshots (EN/ES/PT)
- [ ] Android tablet screenshots (optional)

### Graphics

- [ ] Google Play feature graphic (EN/ES/PT)

### Videos (Optional)

- [ ] Apple App Preview
- [ ] Google Play promo video (YouTube)

---

## Screenshot Scenes to Capture

Capture in each language, on the build being submitted:

| Scene               | Shows                                         |
| ------------------- | --------------------------------------------- |
| 1. Today            | Daily totals, streak                          |
| 2. Add bathroom visit | Size, urgency, leak/pain                    |
| 3. Add drink        | Drink type, amount                            |
| 4. History          | Calendar with entries                         |
| 5. Entry detail     | Full entry with notes                         |
| 6. Weekly chart     | Chart of logged entries, disclaimer line      |
| 7. Export           | Format selection, PDF preview with footer     |
| 8. Settings         | Language, Local Backup, Reminders, Medical information |

---

## Good Practice

- Use real app screens with demo data
- Keep overlays short, readable and localised (pt-PT and Spain Spanish)
- Do not use testimonials, ratings, "clinically proven", "doctor-approved" or health-benefit claims
- Do not show features that are not in the submitted version
- Do not use competitor names or logos

---

## Pre-Submission Checklist

### Apple App Store

- [ ] All required screenshot sizes uploaded (EN/ES/PT)
- [ ] App icon meets guidelines
- [ ] Privacy Policy URL, Support URL and Marketing URL live
- [ ] App Privacy completed: Data Not Collected
- [ ] Regulated medical device declared: No (every region)
- [ ] Category: Health & Fitness, no secondary category
- [ ] Age rating questionnaire completed honestly (expected 4+); record the rating App Store Connect calculates
- [ ] Review notes match the build (`apple/review-notes.md`)

### Google Play Store

- [ ] Feature graphic and phone screenshots uploaded (EN/ES/PT)
- [ ] App icon uploaded
- [ ] Privacy policy URL live
- [ ] Data safety completed: No data collected / No data shared
- [ ] Health apps declaration completed: Health and fitness
- [ ] Content rating questionnaire completed
- [ ] Target audience set: 18 and over

---

## File Organization

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
