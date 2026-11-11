# Eleva Diary — Apple App Privacy Answers

> **Last updated:** 11 November 2026
> **Source:** [Apple, App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/) (checked 11 November 2026)

How to complete App Store Connect > the app > App Privacy for Eleva Diary.

---

## The answer

**"Do you or your third-party partners collect data from this app?" — No.**

The privacy label on the product page then reads **"Data Not Collected"**, for every category, Health & Fitness included.

Privacy Policy URL: https://diary.eleva.care/privacy

---

## Why "Data Not Collected" is correct

### Apple's definitions (quoted from the page above)

- Collect: "'Collect' refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time."
- On-device data: "Data that is processed only on device is not 'collected' and does not need to be disclosed in your answers."
- Data Apple collects: "You are not responsible for disclosing data collected by Apple."

### How the app behaves

| What                                   | Where it is                     | Leaves the device?                                         |
| -------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Diary entries (with notes and edit history) | App's local storage (AsyncStorage), excluded from iCloud and computer backups | No                    |
| Goals, goal history, streak            | App's local storage             | No                                                         |
| Reminder settings, language, onboarding and launch preferences, accepted terms version and date | App's local storage | No                         |
| Reminders                              | Local notifications on the device | No (no push token, no server)                            |
| Export (PDF/CSV/JSON) and backup file  | App's cache folder, then the share sheet | Only where the user sends it                      |
| Legal pages                            | Opened in the browser           | The app sends nothing; the browser loads a public page     |

The app has no network code; no analytics, advertising, tracking or crash-reporting SDKs; no HealthKit; no iCloud entitlement.

### Exports and backup files

Apple's page has no rule written specifically for user-initiated exports, so the conclusion rests on Apple's definition of "collect": when the user sends a report or backup file through the share sheet, it goes to a destination the user chooses (an email, a messaging app, a storage service). Neither Eleva nor any partner of Eleva receives it or can access it, so it is not "collected".

### Device backups

The diary is not in iCloud Backup or computer backups. The app stores it with `@react-native-async-storage/async-storage` 2.2.0, which on iOS marks its storage folder with `NSURLIsExcludedFromBackupKey` unless the Info.plist key `RCTAsyncStorageExcludeFromBackup` is set to false (`RNCAsyncStorage.mm`: "by default, we want to exclude AsyncStorage data from backup"). `app.json` does not set that key, and no config plugin does. Export and backup files sit in the app's cache folder, which iOS never backs up. So nothing leaves the device through Apple's backups, and the label question does not arise. Restoring an iPhone from a backup does not bring the diary back; the privacy policy and Privacy Choices tell users to move it with Export Backup File and Import Backup File. Do not set `RCTAsyncStorageExcludeFromBackup` without rewriting those documents.

What happens to app data in an iPhone-to-iPhone direct transfer (Quick Start) has not been tested; the documents say only that Eleva cannot guarantee the diary comes across and that the backup file is the reliable way.

### What Eleva receives outside the app

Emails that users choose to send to support@eleva.care, privacy@eleva.care or legal@eleva.care are not sent by the app, and the statistics, crash reports and reviews Apple shows developers are collected by Apple. Neither changes the label. The privacy policy covers both (Article 13 GDPR notice).

---

## Settings in App Store Connect

| Question                                              | Answer |
| ----------------------------------------------------- | ------ |
| Do you or your third-party partners collect data from this app? | **No** |

Answering "No" ends the questionnaire: App Store Connect does not ask about data types, linking to identity or tracking. For the record, the per-category answers are:

| Data type category | Collected? |
| ------------------ | ---------- |
| Health & Fitness   | No         |
| Contact Info       | No         |
| Financial Info     | No         |
| Location           | No         |
| Sensitive Info     | No         |
| Contacts           | No         |
| User Content       | No         |
| Browsing History   | No         |
| Search History     | No         |
| Identifiers        | No         |
| Purchases          | No         |
| Usage Data         | No         |
| Diagnostics        | No         |
| Other Data         | No         |

Tracking: none. The app does not link data with third-party data for advertising and shares nothing with data brokers, so it does not show the App Tracking Transparency prompt.

---

## Related declaration: regulated medical device

Not part of App Privacy, but completed in the same App Information area: **"No" for every region**. See `metadata.en.md`. That answer holds only with the product decisions in `_docs/compliance/app-behavior-to-disclosures.md` shipped in the build.

---

## Verification before each submission

The label must match the release build, not only the source code.

- [ ] No analytics, advertising, tracking or crash-reporting packages in `package.json`
- [ ] No iCloud entitlement or iCloud storage APIs; no HealthKit entitlement
- [ ] The built Info.plist has no `RCTAsyncStorageExcludeFromBackup` key (the diary stays out of iCloud and computer backups); on a test iPhone, back up to iCloud, restore, and confirm the diary is not restored. Also test a Quick Start transfer and record the result
- [ ] Inspect the release build's entitlements: `expo-notifications` may add `aps-environment`; that is acceptable only because the app never requests a push token (confirm in `lib/utils/notifications.ts`)
- [ ] Run the release build behind a network proxy for a full session (launch, onboarding, logging, reminders, export, backup, Clear All Data) and confirm there is no traffic, apart from the browser loading diary.eleva.care when a legal link is tapped
- [ ] Export and backup files use the share sheet; import uses the document picker
- [ ] Privacy policy at https://diary.eleva.care/privacy is live and says the same (no collection by the app; Article 13 notice for emails and store data)

---

## References

- [Apple, App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/)
- [App Review Guidelines, 5.1 Privacy and 1.4.1](https://developer.apple.com/app-store/review/guidelines/)
- [Declare regulated medical device status](https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status)
