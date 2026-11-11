# Eleva Diary — Apple App Privacy Answers

> **Last updated:** 11 November 2026  
> **Reference:** [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

This document provides guidance for completing the App Privacy section in App Store Connect for Eleva Diary.

---

## Overview

Apple requires developers to disclose:

1. **Data types collected** by the app
2. Whether data is **linked to user identity**
3. Whether data is used for **tracking**

### Key Definitions (Apple)

- **Collect**: Transmitting data off the device in a form that is readable for a longer period than necessary to service the request in real time.
- **Track**: Linking user/device data with third-party data for targeted advertising or advertising measurement, or sharing with a data broker.

---

## App Behavior Summary

| Feature                                | Data Location        | Off-Device Transmission              |
| -------------------------------------- | -------------------- | ------------------------------------ |
| Diary entries (urination, fluid, leak) | Local (AsyncStorage) | Only via user-initiated export/share |
| Goals & settings                       | Local (AsyncStorage) | Only via user-initiated export/share |
| Local backup file (JSON)               | Generated locally    | Shared via OS share sheet            |
| Export (PDF/CSV/JSON)                  | Generated locally    | Shared via OS share sheet            |
| Reminders                              | Local notifications  | None (no push token, no server)      |

The app has no network code, no analytics, crash reporting or advertising SDKs, and no iCloud entitlement. It does not write to iCloud. iOS may include the app's local data in the user's own device backup (iCloud Backup or a computer backup) according to the user's device settings; the app does not control or initiate this.

---

## Recommended App Privacy Selections

### Section 1: Data Used to Track You

**Selection:** ❌ **No**

**Rationale:** Eleva Diary does not link user data with third-party data for advertising or share data with data brokers. There are no ads, analytics SDKs, or third-party tracking libraries.

---

### Section 2: Data Linked to You

**Selection:** ❌ **None**

The app does not transmit any data off the device itself. Diary data leaves the device only when the user exports a report or a backup file and chooses the destination in the OS share sheet (see "User-Initiated Exports" below), or inside the device backup that iOS makes under the user's own settings (see "Device backups" below).

---

### Section 3: Data Not Linked to You

**Selection:** ❌ **None**

No anonymous or pseudonymous data collection occurs.

---

### Section 4: Data Not Collected

For all data types, select **Data Not Collected**. The resulting privacy label is **"Data Not Collected"**:

| Data Type Category | Collected?       |
| ------------------ | ---------------- |
| Health & Fitness   | ❌ Not collected |
| Contact Info       | ❌ Not collected |
| Financial Info     | ❌ Not collected |
| Location           | ❌ Not collected |
| Sensitive Info     | ❌ Not collected |
| Contacts           | ❌ Not collected |
| User Content       | ❌ Not collected |
| Browsing History   | ❌ Not collected |
| Search History     | ❌ Not collected |
| Identifiers        | ❌ Not collected |
| Purchases          | ❌ Not collected |
| Usage Data         | ❌ Not collected |
| Diagnostics        | ❌ Not collected |
| Other Data         | ❌ Not collected |

---

## Health & Fitness Data — Detailed Breakdown

Since Eleva Diary handles bladder health data, you must carefully answer the Health & Fitness section:

### Health

**Is health data collected?**

- **Answer:** ❌ **No**

Bladder diary data is stored only on the device (AsyncStorage). The app does not send it to Eleva Care, to Apple's iCloud storage, or to any other service. Because the data is not collected, App Store Connect does not ask for purpose, linkage to identity or tracking for this data type.

**Device backups:** If the user has iCloud Backup turned on or backs up the device to a computer, iOS may include the app's local data in that backup. This is done by iOS under the user's own settings; the app does not initiate it and the developer has no access to it.

---

## User-Initiated Exports

Apple's definition excludes user-initiated actions from "collection":

> "Data that is sent off the device only at the user's explicit direction, and only when the data is sent to a third party chosen by the user, does not need to be disclosed."

Therefore, the PDF/CSV/JSON export feature does **not** require disclosure as "collection" because:

1. It is user-initiated (user taps export)
2. User chooses the destination (via OS share sheet)
3. Data is not sent to the developer or any predetermined third party

---

## Verification Checklist

Before submitting, verify:

- [ ] No analytics SDKs in `package.json` (e.g., Firebase Analytics, Amplitude)
- [ ] No crash reporting or performance monitoring SDKs (e.g., Sentry, Crashlytics)
- [ ] No ad SDKs
- [ ] No iCloud entitlement or iCloud storage APIs in `app.json` and `package.json`
- [ ] No network requests in app code and no push token requested (reminders are local notifications)
- [ ] Local backup file uses the OS share sheet to export and the document picker to import
- [ ] Export feature uses OS share sheet (user controls destination)

---

## References

- [Apple App Privacy Details - Developer Documentation](https://developer.apple.com/app-store/app-privacy-details/)
- [App Store Review Guidelines - Section 5.1 Privacy](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [Health Data Guidelines](https://developer.apple.com/app-store/review/guidelines/#health-and-health-research)
