# Eleva Diary — Google Play Data Safety Answers

> **Last updated:** 11 November 2026
> **Sources (checked 11 November 2026):** [Google Play, Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469); [Android Developers, Back up user data with Auto Backup](https://developer.android.com/identity/data/autobackup)

How to complete Play Console > App content > Data safety for Eleva Diary.

---

## The answer

**"Does your app collect or share any of the required user data types?" — No.**

The store listing then shows **"No data collected"** and **"No data shared with third parties"**.

When you answer No, Play Console does not ask for data types, purposes or security practices. Do not add an encryption-in-transit claim or a "you can request that data be deleted" claim: there is no transmission and no request channel for app data, so either badge would be inaccurate.

Privacy policy URL (App content > Privacy policy, required even when nothing is collected): https://diary.eleva.care/privacy

---

## Why "No data collected / No data shared" is correct

### Google's definitions (paraphrased from the Data safety help page; check the page for the exact text)

- **Collection** means transmitting user data from the app off the user's device. Data that is only processed locally on the device and not sent off it does not need to be disclosed.
- **Sharing** means transferring user data collected by the app to a third party. A transfer based on a specific user-initiated action, where the user reasonably expects the data to be shared, is not sharing.
- **End-to-end encryption:** data sent off the device that is unreadable by the developer or anyone other than the sender and recipient does not need to be disclosed.
- **The user's own cloud storage (FAQ):** if the user chooses to upload their data directly to their own external drive or cloud storage account, under that provider's terms, and the app never collects or accesses the data, the app does not declare it.

### 1. Diary data on the device: not collected

Entries (with notes and edit history), goals, goal history, streak, reminder settings, language, onboarding and launch preferences, and the accepted terms version and date are stored in the app's local storage. The app has no network code and no analytics, advertising, tracking or crash-reporting SDK. Nothing is sent to Eleva or to a third party.

### 2. Reminders: not collected

Reminders are local notifications scheduled on the device. No push token is requested and nothing is sent to a server.

### 3. Exports and backup files: user-initiated, not collected, not shared

"Export Data" (PDF/CSV/JSON) and "Export Backup File" write a file to the app's cache folder and open the Android share sheet. The user picks the destination (email, a messaging app, a storage service). Eleva never receives the file. Because the transfer happens only on the user's specific action and goes where the user expects, it falls within Google's user-initiated exception to "sharing". The files are deleted at launch, before each export and by Clear All Data.

### 4. Android Auto Backup: not collected

Google's Data safety page does not mention Android Auto Backup by name, so this conclusion rests on how Auto Backup works and on the exceptions above:

- Auto Backup is Android's own service. If the user has turned on device backup, Android uploads the app's data to a private folder in the user's Google Drive account, protected by the user's Google Account credentials. The backup cannot be read by the user or other apps on the device, and Eleva has no access to it. (Android Developers, Auto Backup: "Backup location".)
- On Android 9 and later, the backup is end-to-end encrypted with the device's PIN, pattern or password. (Auto Backup, introduction and "Define device conditions required for backup".)
- **Product decision 7:** the app keeps `allowBackup` on but adds backup rules so that cloud backup happens only when it can be end-to-end encrypted: `disableIfNoEncryptionCapabilities="true"` in `<cloud-backup>` (Android 12 and later) and `requireFlags="clientSideEncryption"` on the `<include>` rules (Android 9 to 11). Device-to-device transfer stays allowed on Android 9 and later; it does not go through a server. On Android 7 to 8.1, where backups cannot be end-to-end encrypted and `requireFlags` does not exist, the rules exclude everything: no cloud backup and no device-to-device transfer (`plugins/with-android-backup-rules.js`).

With those rules, the diary reaches Google's cloud only as an end-to-end-encrypted backup in the user's own account that Eleva cannot read. That is covered both by the end-to-end-encryption exception and by the user's-own-cloud-storage FAQ. The privacy policy and privacy choices page describe Auto Backup, including that a reinstall can restore the diary, that an older backup may hold the diary until the next backup after Clear All Data, that after uninstalling the last backup stays in the user's Google account until the user deletes it or Google removes it under its own rules, and that nothing is backed up or transferred on Android 7 to 8.1.

**Prerequisite:** the release build must contain these backup rules. Without them, a device with no screen lock could upload an unencrypted backup, and the answer would rest only on the cloud-storage FAQ.

### 5. What Eleva receives outside the app

Emails users choose to send to support@eleva.care, privacy@eleva.care or legal@eleva.care are not sent by the app. Android vitals (crash and ANR data from users who share it with developers), statistics and reviews are collected by Google Play, not by the app. Neither is declared in Data safety; both are covered by the privacy policy's Article 13 GDPR notice.

---

## Data deletion

- **Delete account URL:** not applicable; the app has no accounts.
- **Optional data deletion link:** https://diary.eleva.care/privacy-choices (explains Clear All Data, deleting single entries, deleting export and backup files, and removing Android backups from the Google account).
- In the app: Settings > Clear All Data > type DELETE to confirm. This deletes entries, goals, goal history, streak, reminder settings, the launch preference and the export/backup files the app saved, and cancels reminders. It keeps the language and the completed onboarding.

---

## Release blockers

Answer "No" only for a build that has all of these:

- [ ] Android backup rules from product decision 7 in the merged manifest (`android:dataExtractionRules` with `disableIfNoEncryptionCapabilities="true"`, and `android:fullBackupContent` with `requireFlags="clientSideEncryption"` in `res/xml-v28` and exclude-all rules in `res/xml`): run `npx expo prebuild -p android` and read the merged release manifest and the `res/xml` and `res/xml-v28` files; check that no dependency overrides the attributes
- [ ] On a device: `adb shell bmgr backupnow care.eleva.peediary` on Android 12+ without a screen lock (no cloud backup) and with one (backup made); repeat on Android 9–11 and on Android 7–8.1 (nothing backed up); uninstall and reinstall to confirm restore behaviour matches the privacy policy
- [ ] No `google-services.json` in the project, so Firebase is never initialised (`expo-notifications` brings in the Firebase Cloud Messaging library on Android)
- [ ] No analytics, advertising, tracking or crash-reporting packages
- [ ] Release build run behind a network proxy for a full session (launch, onboarding, logging, reminders, export, backup, Clear All Data): no traffic, apart from the browser loading diary.eleva.care when a legal link is tapped
- [ ] Export and backup use the share sheet; import uses the system file picker
- [ ] Privacy policy at https://diary.eleva.care/privacy is live and consistent with this answer

---

## References

- [Google Play, Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play, User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Android Developers, Back up user data with Auto Backup](https://developer.android.com/identity/data/autobackup)
