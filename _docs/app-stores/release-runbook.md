# Eleva Diary 1.0.0 — Release Runbook

> **Last updated:** 12 November 2026
> **Purpose:** the steps from this repository to both stores, in order, with who does each one. Details of each field are in `assets-checklist.md`, `apple/` and `google/`.

The app, the store texts and the store images are ready in this repository. What is left needs the owner's accounts, money or signature, and cannot be done from the code.

---

## 1. Before the first build (owner)

- [ ] `eas login` with the Expo account that owns the `eleva-care` organisation (project id in `app.json`)
- [ ] Apple Developer Program membership active for BÚZIOS E TARTARUGAS - LDA (organisation, D-U-N-S)
- [ ] Google Play developer account of type **Organisation** for the same company. A personal account opened after 13 November 2023 must first run a closed test with 12 testers for 14 days
- [ ] A company phone number for the EU Digital Services Act trader details (both stores show it publicly in the EU)
- [ ] Portuguese lawyer's sign-off on the role wording, the liability clause and the governing-law clause (`_docs/compliance/app-behavior-to-disclosures.md`, owner actions)
- [ ] Decide the list of EU/EEA countries (both stores)

## 2. Build (owner runs, from this repository)

```bash
pnpm install
pnpm test && pnpm lint && pnpm exec tsc --noEmit && npx expo-doctor
eas build --profile production --platform all
```

- iOS: let EAS create the distribution certificate and provisioning profile.
- Android: let EAS create the upload keystore and keep a backup of it (`eas credentials`). Accept **Play App Signing** on the first upload.

## 3. Test the store builds (owner, about one day)

- [ ] TestFlight on a real iPhone, and the iPad simulator in iPhone compatibility mode (App Review may test there)
- [ ] Play Console internal testing on a real Android phone; read the pre-launch report; App bundle explorer shows target SDK 36 and 16 KB page-size support
- [ ] On both: onboarding, add/edit/delete each entry type, set and remove a fluid target, export PDF/CSV/JSON, save and restore a backup, reminders on/off and with notifications blocked in the phone's settings, Clear All Data
- [ ] Android backup checks in `google/data-safety-answers.md` (`adb shell bmgr backupnow care.eleva.peediary`), before answering Data safety

## 4. App Store Connect (owner)

- [ ] Business > Digital Services Act: trader status with address, support@eleva.care and the company phone; wait for verification
- [ ] New app: name "Eleva Diary", primary language English (U.K.), bundle `care.eleva.peediary`, SKU of your choice
- [ ] Listings EN, ES, PT from `apple/metadata.*.md` (subtitle, promotional text, description, keywords)
- [ ] Copyright "2026 BÚZIOS E TARTARUGAS - LDA"; Content Rights: no third-party content
- [ ] Category Health & Fitness, no secondary category
- [ ] Privacy Policy URL https://diary.eleva.care/privacy, Support URL https://diary.eleva.care/en/support, Marketing URL https://diary.eleva.care; optional User Privacy Choices URL https://diary.eleva.care/privacy-choices
- [ ] App Privacy: **Data Not Collected** (`apple/app-privacy-answers.md`)
- [ ] Regulated medical device: **No** for every region (Account Holder or Admin)
- [ ] Age rating questionnaire answered honestly; record the rating Apple calculates
- [ ] Screenshots: `store-screenshots/apple/{en,pt,es}/` (1320 × 2868, the 6.9" set)
- [ ] App Review Information: untick **Sign-in required** (there are no accounts); contact name, phone and email support@eleva.care; review notes from `apple/review-notes.md`
- [ ] Pricing and Availability: price **Free**, then the EU/EEA countries decided in step 1
- [ ] Accessibility Nutrition Labels (optional): leave blank or answer honestly for the tested build
- [ ] On the 1.0 version page, select the uploaded build. Export compliance needs no answers (`ITSAppUsesNonExemptEncryption` is false)
- [ ] Submit with `eas submit --profile production --platform ios`, then "Add for Review"

## 5. Google Play Console (owner)

- [ ] Developer account: trader status (DSA) with the same details
- [ ] Create app "Eleva Diary", default language English (United Kingdom), free, app
- [ ] Store listings en-GB, es-ES, pt-PT from `google/metadata.*.md`; icon `google/play-icon-512.png`; feature graphic and phone screenshots from `store-screenshots/google/{en,pt,es}/`
- [ ] App content: privacy policy, Ads (No), App access (all functionality without special access), content rating (IARC), target audience 18+, Data safety (No data collected / No data shared), Health apps (Health and fitness), Financial features (none), Government app (no)
- [ ] Countries: the EU/EEA list from step 1
- [ ] Service account key with release permission saved as `secrets/play-service-account.json` (git-ignored); after the first manual upload, `eas submit --profile production --platform android` sends builds to the internal track as drafts
- [ ] Promote internal → production when the internal test passes; release notes from `apple/release-notes-templates.md` (1.0.0, Google Play)

## 6. After both are live

- [ ] Add the store badges to diary.eleva.care (none until then)
- [ ] Watch support@eleva.care for the first week
