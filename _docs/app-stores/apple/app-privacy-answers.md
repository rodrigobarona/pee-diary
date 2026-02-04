# Eleva Diary — Apple App Privacy Answers

> **Last updated:** February 2026  
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
| iCloud backup (iOS only)               | Apple iCloud KVS     | Yes, when user enables backup        |
| Export (PDF/CSV/JSON)                  | Generated locally    | Shared via OS share sheet            |

---

## Recommended App Privacy Selections

### Section 1: Data Used to Track You

**Selection:** ❌ **No**

**Rationale:** Eleva Diary does not link user data with third-party data for advertising or share data with data brokers. There are no ads, analytics SDKs, or third-party tracking libraries.

---

### Section 2: Data Linked to You

**Selection:** ⚠️ **Yes** (conditional on iCloud backup usage)

If the user enables optional iCloud backup, health data is transmitted to Apple's iCloud Key-Value Store. This data is linked to the user's Apple ID.

| Data Type                 | Linked? | Reason                                                           |
| ------------------------- | ------- | ---------------------------------------------------------------- |
| Health & Fitness → Health | Yes     | iCloud backup stores bladder diary data in user's iCloud account |

**If asked for purpose:** Select **App Functionality** (backup/restore)

---

### Section 3: Data Not Linked to You

**Selection:** ❌ **None**

No anonymous or pseudonymous data collection occurs.

---

### Section 4: Data Not Collected

For all other data types, select **Data Not Collected**:

| Data Type Category | Collected?       |
| ------------------ | ---------------- |
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

- **Answer:** ⚠️ **Yes** (conservatively, due to iCloud backup)

**How is it used?**

| Purpose                 | Selected?               |
| ----------------------- | ----------------------- |
| App Functionality       | ✅ Yes (backup/restore) |
| Analytics               | ❌ No                   |
| Developer's Advertising | ❌ No                   |
| Third-Party Advertising | ❌ No                   |
| Product Personalization | ❌ No                   |
| Other Purposes          | ❌ No                   |

**Is it linked to user identity?**

- **Answer:** ✅ Yes (linked to Apple ID via iCloud)

**Is it used for tracking?**

- **Answer:** ❌ No

---

## Alternative: If iCloud Backup is Removed

If you remove the iCloud backup feature entirely, you can answer:

- **Health & Fitness Data Collected:** ❌ No
- This would allow a "Data Not Collected" privacy label

However, the current implementation includes optional iCloud backup, so the conservative disclosure above is recommended.

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
- [ ] No crash reporting SDKs that collect user data
- [ ] No ad SDKs
- [ ] iCloud backup implementation uses only Apple's iCloud KVS (no third-party cloud)
- [ ] Export feature uses OS share sheet (user controls destination)

---

## References

- [Apple App Privacy Details - Developer Documentation](https://developer.apple.com/app-store/app-privacy-details/)
- [App Store Review Guidelines - Section 5.1 Privacy](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [Health Data Guidelines](https://developer.apple.com/app-store/review/guidelines/#health-and-health-research)
