# Eleva Diary — Notes for App Review (Apple)

> **Last updated:** February 2026  
> **Purpose:** Guidance for App Store Review team to facilitate smooth app review

---

## App Overview

**Eleva Diary** is a personal bladder diary app that helps users track urination, fluid intake, and leak episodes. The app is designed for individuals managing bladder health conditions or preparing health data to share with healthcare providers.

---

## Key Information for Reviewers

### 1. No Account Required

Eleva Diary does not require user registration or login. All data is stored locally on the device using AsyncStorage. Users can start using the app immediately upon first launch.

### 2. Health App — Not a Medical Device

Eleva Diary is a **logging/diary tool**, not a medical device. It does not:

- Diagnose any medical condition
- Provide treatment recommendations
- Replace professional medical advice
- Connect to medical devices or sensors

A medical disclaimer is displayed in the app description and will be visible in the app's About section.

### 3. Data Privacy

- **Local storage only**: All diary entries are stored on-device
- **Optional iCloud backup**: Users can choose to back up data to iCloud (iOS only); this uses Apple's iCloud Key-Value Store
- **User-controlled export**: Users can export data as PDF, CSV, JSON, or Excel via the OS share sheet
- **No analytics**: No third-party analytics or tracking SDKs are included
- **No ads**: The app is ad-free

### 4. Content Rating

The app is suitable for all ages (4+). It does not contain:

- Violence
- Sexual content
- Profanity
- Gambling
- User-generated content shared publicly

While the app deals with health topics, the content is clinical/medical logging (e.g., "urination," "fluid intake") and is not objectionable.

---

## Testing the App

### How to Test Core Features

1. **Add a urination entry**: Tap the "+" button → Select "Urination" → Choose volume, urgency → Save
2. **Add a fluid entry**: Tap "+" → Select "Fluid" → Choose type, enter amount → Save
3. **Add a leak entry**: Tap "+" → Select "Leak" → Choose severity, urgency → Save
4. **View history**: Navigate to History tab → See calendar with entry dots → Tap a day to see entries
5. **View insights**: Navigate to Home tab → See daily progress, weekly chart, streak
6. **Export data**: Settings → Export → Choose format → Share via share sheet
7. **iCloud backup** (iOS): Settings → iCloud Sync → Tap "Back Up Now"
8. **Change language**: Settings → Language → Select English/Spanish/Portuguese

### Demo Credentials

**Not applicable** — No login required. App works immediately on first launch.

---

## Permissions Requested

| Permission    | Purpose | When Prompted |
| ------------- | ------- | ------------- |
| None required | —       | —             |

Eleva Diary does not request any special permissions (no camera, location, contacts, etc.).

The iCloud backup feature uses the app's iCloud container entitlement (configured in Xcode) and does not require runtime permission prompts.

---

## Localization

The app is fully localized in:

- English (en)
- Spanish (es)
- Portuguese (pt)

The app automatically detects the device language and falls back to English if the locale is not supported.

---

## Technical Details

| Item        | Value                      |
| ----------- | -------------------------- |
| Framework   | React Native (Expo SDK 54) |
| Minimum iOS | 13.4                       |
| Bundle ID   | care.eleva.peediary        |
| Developer   | Buzios e Tartarugas, Lda.  |

---

## Contact Information

If you have questions during review, please contact:

- **Email**: <diary@eleva.care>
- **Support URL**: <https://eleva.care/support>
- **Privacy Policy**: <https://eleva.care/privacy>

---

## Common Review Concerns — Preemptive Clarifications

### "Is this a medical device?"

No. Eleva Diary is a personal logging tool similar to a paper bladder diary traditionally recommended by urologists. It does not diagnose, treat, or provide clinical recommendations.

### "Why does it access Health data?"

Eleva Diary does **not** read from or write to Apple HealthKit. The "Health & Fitness" privacy disclosure relates only to the app's own diary data, which may be backed up to iCloud when the user enables that optional feature.

### "Are you a healthcare provider?"

The developer (Eleva Care) provides health and wellness tools but is not a licensed healthcare provider. The app includes appropriate disclaimers.

### "How is data protected?"

- Data at rest: Stored in AsyncStorage (app sandbox, encrypted by iOS)
- Data in transit (iCloud): Uses Apple's secure iCloud infrastructure
- No server-side storage: Eleva Care does not operate servers that store user health data

---

## Screenshots & App Previews

Screenshots and app previews submitted with this app accurately represent the app's functionality and do not contain misleading imagery or claims.

---

Thank you for reviewing Eleva Diary. We're committed to compliance with App Store guidelines and welcome any feedback.
