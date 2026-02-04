# Eleva Diary — Google Play Data Safety Answers

> **Last updated:** February 2026  
> **Reference:** [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)

This document provides guidance for completing the Data Safety section in Google Play Console for Eleva Diary.

---

## Overview

Google Play requires developers to disclose:

1. Whether data is **collected** (transmitted off-device)
2. Whether data is **shared** with third parties
3. Security practices (encryption, deletion)

### Key Definitions (Google Play)

- **Collect**: Transmitting data off the user's device. Data processed ephemerally or only stored locally is NOT considered collected.
- **Share**: Transferring data to a third party (excluding service providers acting on your behalf, legal requirements, or user-initiated transfers).

---

## App Behavior Summary

| Feature                     | Data Location        | Off-Device?         |
| --------------------------- | -------------------- | ------------------- |
| Diary entries               | Local (AsyncStorage) | ❌ No               |
| Goals & settings            | Local (AsyncStorage) | ❌ No               |
| Export (PDF/CSV/JSON/Excel) | Generated locally    | User-initiated only |
| Language preference         | Local                | ❌ No               |

**Note:** The Android version of Eleva Diary does **not** include cloud backup functionality. iCloud backup is iOS-only.

---

## Data Safety Form Answers

### Section 1: Data Collection and Security

#### "Does your app collect or share any of the required user data types?"

**Answer:** ✅ Yes

**Explanation:** Even though data is stored locally, we declare "Health info" as collected to be conservative. Google may interpret health logging as data collection. See detailed breakdown below.

---

### Section 2: Data Types

#### Health and fitness → Health info

**Is this data collected?**

| Question                            | Answer            | Explanation                                                                |
| ----------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| Is this data collected?             | ⚠️ Optionally Yes | Health diary data is stored on-device only, but we disclose conservatively |
| Is this data shared?                | ❌ No             | Not shared with any third party                                            |
| Is this data processed ephemerally? | ❌ No             | Data is persisted locally                                                  |
| Is this data required or optional?  | ✅ Required       | Core app functionality                                                     |

**If marking as collected, select purposes:**

| Purpose                                | Selected? |
| -------------------------------------- | --------- |
| App functionality                      | ✅ Yes    |
| Analytics                              | ❌ No     |
| Developer communications               | ❌ No     |
| Advertising or marketing               | ❌ No     |
| Fraud prevention, security, compliance | ❌ No     |
| Personalization                        | ❌ No     |
| Account management                     | ❌ No     |

#### All Other Data Types

For all other data categories, answer **"Not collected"**:

| Data Type                         | Collected? | Shared? |
| --------------------------------- | ---------- | ------- |
| Location                          | ❌ No      | ❌ No   |
| Personal info (name, email, etc.) | ❌ No      | ❌ No   |
| Financial info                    | ❌ No      | ❌ No   |
| Messages                          | ❌ No      | ❌ No   |
| Photos and videos                 | ❌ No      | ❌ No   |
| Audio files                       | ❌ No      | ❌ No   |
| Files and docs                    | ❌ No      | ❌ No   |
| Calendar                          | ❌ No      | ❌ No   |
| Contacts                          | ❌ No      | ❌ No   |
| App activity                      | ❌ No      | ❌ No   |
| Web browsing                      | ❌ No      | ❌ No   |
| App info and performance          | ❌ No      | ❌ No   |
| Device or other IDs               | ❌ No      | ❌ No   |

---

### Section 3: Security Practices

#### "Is data encrypted in transit?"

**Answer:** ✅ Yes (N/A — no data transmitted)

**Explanation:** The app does not transmit data to servers. For user-initiated exports, the OS share sheet handles transmission security.

#### "Do you provide a way for users to request that their data be deleted?"

**Answer:** ✅ Yes

**How users delete data:**

1. Open Settings in the app
2. Tap "Clear Data" / "Clear All Data"
3. Confirm deletion
4. All diary entries, goals, and settings are permanently deleted from the device

**Data deletion URL (optional):** Include link to privacy choices page once published:
`https://eleva.care/privacy-choices`

---

### Section 4: Data Sharing

#### "Does your app share user data with third parties?"

**Answer:** ❌ No

**Explanation:** Eleva Diary does not share user data with any third party. User-initiated exports (where the user chooses to send their data via email, etc.) are excluded from the "sharing" definition per Google's guidelines.

---

## Alternative: Minimal Disclosure Approach

If you prefer, you could argue that:

- Data stored only on-device is "not collected" per Google's definition
- No data leaves the device without explicit user action
- Therefore: **No data collected, no data shared**

This would result in a "Data not collected" badge. However, health apps often receive extra scrutiny, so the conservative approach (disclosing Health info) is recommended.

---

## Summary for Data Safety Label

Based on the above answers, the Data Safety label will show:

```
┌─────────────────────────────────────────┐
│ Data safety                              │
├─────────────────────────────────────────┤
│ ✓ No data shared with third parties     │
│ ✓ Data encrypted in transit             │
│ ✓ You can request that data be deleted  │
│                                          │
│ Data collected:                          │
│ • Health info                            │
│   └─ Used for: App functionality         │
└─────────────────────────────────────────┘
```

---

## Verification Checklist

Before submitting, verify:

- [ ] No analytics SDKs (Firebase Analytics, etc.) in the Android build
- [ ] No crash reporting that collects user data (Sentry with PII, etc.)
- [ ] No ad SDKs
- [ ] No third-party auth providers
- [ ] Clear Data functionality works correctly
- [ ] Export uses Android share sheet (user controls destination)

---

## References

- [Google Play Data Safety Help](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Data Safety Form Guide](https://developer.android.com/guide/topics/data/collect-share)
- [Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/10632613)
