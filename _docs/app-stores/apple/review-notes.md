# Eleva Diary — Notes for App Review (Apple)

> **Last updated:** 11 November 2026
> **Purpose:** Text for App Store Connect > App Review Information > Notes, plus the facts behind it.

These notes describe the build that ships the product decisions listed in `_docs/compliance/app-behavior-to-disclosures.md`. Before pasting them into App Store Connect, check every path below on that exact build. If something is not in the build, fix the build or the notes; never tell App Review about a screen that does not exist.

---

## Text to paste into "Notes" (App Review Information)

```
Eleva Diary is a personal bladder diary. Users record bathroom visits, drinks and leaks on the device and can export the record to share with a health professional. It does not interpret entries or give health advice.

- No account or sign-in. All features work immediately; no demo account is needed.
- No network requests. No analytics, advertising, tracking or crash-reporting SDKs. No HealthKit. No iCloud entitlement; the app does not write to iCloud. The diary is stored only in the app's local storage on the device.
- Data leaves the device only when the user exports a PDF, CSV or JSON report, or a backup file, and sends it through the iOS share sheet to a destination they choose. The diary is excluded from iCloud Backup and computer backups (AsyncStorage's default backup exclusion); users move it to a new phone with Export Backup File and Import Backup File.
- Permissions: notifications only, requested when the user turns on Settings > Reminders. Reminders are local notifications scheduled on the device ("Time to update your diary"). No push token is requested or sent.
- Medical disclaimer: shown on the last onboarding page (Skip leads to that page, so every user sees it), in Settings > Medical information (About section), under the charts on the Today screen, and in the footer of every PDF report.
- The last onboarding page shows "By continuing, you accept the Terms of Use. See how your data is handled in the Privacy Policy.", with links to both. The user accepts by tapping Get Started on that page. When the Terms version changes, the app shows a notice on launch with a link to the new Terms and an Accept button.
- Legal pages: Settings > Privacy Policy, Terms of Use and Privacy Choices open the page in the app's language in the browser, for example https://diary.eleva.care/en/privacy, /en/terms and /en/privacy-choices. The website has no analytics, tracking, forms or third-party scripts.
- Regulated medical device: declared "No" for every region. The app is a record-keeping tool with no diagnostic, monitoring or treatment function.
- Languages: English, Spanish (Spain) and Portuguese (Portugal).
- Built with Expo SDK 57 (React Native). Minimum iOS 16.4.

Contact: support@eleva.care
```

---

## How to test

1. **First launch:** go through onboarding, or tap Skip, which leads to the last page. The last page shows the disclaimer and the Terms of Use and Privacy Policy notice with links; tap Get Started.
2. **Add a bathroom visit:** tap "+" > Urination > choose size or enter ml, urgency, leak/pain, optional note > Save.
3. **Add a drink:** tap "+" > Fluid Intake > choose type and amount > Save.
4. **Add a leak:** tap "+" > Leak/Accident > choose amount, urgency, optional activity and note > Save.
5. **Today:** see daily totals, the fluid card (intake and estimated output totals only), weekly and monthly charts, the number of days the user's own fluid goal was reached ("Fluid goal reached"), the streak, and the disclaimer under the charts.
6. **History:** open the History tab, pick a day, open an entry, edit it or tap Delete.
7. **Export Data:** Settings > Export Data > choose PDF, CSV or JSON and dates > share sheet. The PDF footer carries the disclaimer.
8. **Local Backup:** Settings > Local Backup > Export Backup File (share sheet); Import Backup File (document picker; replaces the current diary after confirmation).
9. **Reminders:** Settings > Reminders > Enable Reminders. iOS asks for notification permission at this point and not before.
10. **Medical information:** Settings > About > Medical information.
11. **Clear All Data:** Settings > Clear All Data > type DELETE to confirm. Deletes entries, the fluid goal and its history, the streak, reminder settings, the launch preference and export/backup files, and cancels reminders. Keeps the language, the completed onboarding and the accepted Terms version and date.
12. **Language:** Settings > Language > English, Español or Português.

**Demo account:** not applicable.

---

## Permissions

| Permission    | Purpose                                    | When requested                                         |
| ------------- | ------------------------------------------ | ------------------------------------------------------ |
| Notifications | Local reminders to update the diary (no push) | Only when the user turns on Settings > Reminders    |

No other permissions (no camera, microphone, location, contacts, photos, HealthKit or tracking).

---

## Answers to likely questions

### Is this a medical device?

No. Eleva Diary is a personal diary, like a paper bladder diary. It stores what the user enters, shows totals and simple charts of those entries, and exports them. It does not interpret the entries, tell the user whether results are normal, or give health advice. The only goal is a daily fluid goal the user sets themselves; its starting value (2000 ml) can be changed and is not presented as a medical norm. The regulated medical device declaration is "No" for every region (see `metadata.en.md`).

### Does the app give health information? (Guideline 1.4.1)

No. It is a record-keeping tool and gives no health advice. The disclaimer ("Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms.") is shown on the last onboarding page, in Settings > Medical information, under the charts and in the PDF footer.

### Why the Health & Fitness category but no HealthKit?

The app keeps its own diary on the device and does not read from or write to HealthKit.

### How is data stored and protected?

- The diary is kept in the app's private storage on the device. The app adds no encryption of its own; iOS protects the device's storage with its own encryption when the user has a passcode.
- Nothing is sent to a server: the app has no network code, and Eleva has no server that holds diary data.
- Export and backup files are written to the app's cache folder, handed to the share sheet, and deleted at launch, before each export and by Clear All Data.

### What does the developer receive?

Nothing from the app. Eleva only receives what users choose to send by email, and the aggregated statistics, crash reports (from users who agreed to share them with developers) and reviews that Apple provides.

---

## Technical details

| Item          | Value                                                  |
| ------------- | ------------------------------------------------------ |
| App name      | Eleva Diary (store and home screen)                    |
| Framework     | Expo SDK 57 (React Native)                             |
| Minimum iOS   | 16.4                                                   |
| Bundle ID     | care.eleva.peediary (internal identifier, not shown to users) |
| Seller        | BÚZIOS E TARTARUGAS - LDA (brand Eleva.care), NIPC 515001708, Rua Gil Vicente 2, 2775-198 Parede, Portugal |

---

## Contact during review

- **Email:** support@eleva.care
- **Privacy Policy:** https://diary.eleva.care/privacy
- **Terms of Use:** https://diary.eleva.care/terms
- **Support URL:** https://diary.eleva.care/privacy-choices

The App Review contact name and phone number are entered in App Store Connect by the owner.

---

## Screenshots

Screenshots show the submitted build: neutral fluid totals with no ratio or "normal" labels, neutral charts, and no claim of health benefits. See `assets-checklist.md`.
