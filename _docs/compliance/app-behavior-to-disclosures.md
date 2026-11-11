# Eleva Diary — App Behavior to Disclosures Mapping

> **Last updated:** 11 November 2026  
> **Purpose:** Single source of truth mapping app features to required privacy/compliance disclosures

This document maps Eleva Diary's actual app behavior to the required disclosures for Apple App Store, Google Play Store, and legal documents.

---

## App Feature Inventory

### Core Features

| Feature              | Description                                                       | Data Type     | Storage Location     | Off-Device? |
| -------------------- | ----------------------------------------------------------------- | ------------- | -------------------- | ----------- |
| Urination logging    | Record bathroom visits with volume, urgency, leak/pain indicators | Health data   | AsyncStorage (local) | No          |
| Fluid intake logging | Record drinks with type and amount                                | Health data   | AsyncStorage (local) | No          |
| Leak logging         | Record incontinence episodes with severity and urgency            | Health data   | AsyncStorage (local) | No          |
| Daily goals          | Set targets for fluid intake and bathroom visits                  | Preferences   | AsyncStorage (local) | No          |
| Streak tracking      | Track consecutive days of logging                                 | Usage metrics | AsyncStorage (local) | No          |
| Insights/Charts      | View weekly/monthly patterns                                      | Derived data  | Computed on-device   | No          |
| Edit history         | Track changes to entries                                          | Health data   | AsyncStorage (local) | No          |

### Data Export Features

| Feature      | Description                   | Destination                   | User-Initiated? |
| ------------ | ----------------------------- | ----------------------------- | --------------- |
| PDF export   | Formatted report with summary | User-controlled (share sheet) | Yes             |
| CSV export   | Spreadsheet-compatible format | User-controlled (share sheet) | Yes             |
| JSON export  | Technical/backup format       | User-controlled (share sheet) | Yes             |

### Backup Features

| Feature            | Platform      | Description                                                   | Data Destination                            |
| ------------------ | ------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Export backup file | iOS & Android | JSON file with entries, goals, goal history, streak, language | User-controlled (share sheet)               |
| Import backup file | iOS & Android | Restore from a file picked with the system document picker    | From file to device (replaces current data) |

### Operating System Backups (Not App Features)

| Mechanism           | Platform | Behavior                                                                                    | Controlled By           |
| ------------------- | -------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| Device backup       | iOS      | iCloud Backup or a computer backup may include the app's local data                         | User's iOS settings     |
| Android Auto Backup | Android  | `android.allowBackup: true`; may copy app data to the user's Google account if backup is on | User's Android settings |

### Non-Features (Not Present)

| Feature               | Present? | Notes                          |
| --------------------- | -------- | ------------------------------ |
| User accounts/login   | ❌ No    | No authentication required     |
| Analytics SDKs        | ❌ No    | No Firebase, Amplitude, etc.   |
| Crash reporting       | ❌ No    | No Sentry, Crashlytics, etc.   |
| Performance tracing   | ❌ No    | No tracing or session replay   |
| iCloud storage        | ❌ No    | No iCloud entitlement or KVS   |
| Advertising           | ❌ No    | No ad SDKs                     |
| Third-party auth      | ❌ No    | No Google/Apple/Facebook login |
| HealthKit integration | ❌ No    | No iOS HealthKit read/write    |
| Remote server sync    | ❌ No    | No proprietary cloud sync      |
| Push notifications    | ❌ No    | Local reminders only, no token |

---

## Apple App Store Disclosures

### App Privacy Label Mapping

| Apple Category       | Sub-category | Collected? | Linked to Identity? | Used for Tracking? | Rationale                         |
| -------------------- | ------------ | ---------- | ------------------- | ------------------ | --------------------------------- |
| **Health & Fitness** | Health       | No         | —                   | —                  | Not collected                     |
| Contact Info         | (all)        | No         | —                   | —                  | Not collected                     |
| Financial Info       | (all)        | No         | —                   | —                  | Not collected                     |
| Location             | (all)        | No         | —                   | —                  | Not collected                     |
| Sensitive Info       | (all)        | No         | —                   | —                  | Not collected                     |
| Contacts             | (all)        | No         | —                   | —                  | Not collected                     |
| User Content         | (all)        | No         | —                   | —                  | Not collected                     |
| Browsing History     | (all)        | No         | —                   | —                  | Not collected                     |
| Search History       | (all)        | No         | —                   | —                  | Not collected                     |
| Identifiers          | (all)        | No         | —                   | —                  | Not collected                     |
| Purchases            | (all)        | No         | —                   | —                  | Not collected                     |
| Usage Data           | (all)        | No         | —                   | —                  | Not collected                     |
| Diagnostics          | (all)        | No         | —                   | —                  | Not collected                     |
| Other Data           | (all)        | No         | —                   | —                  | Not collected                     |

#### Health Data Disclosure Details

**Why Health data is declared "Data Not Collected":**

Per Apple's definition, "collect" means transmitting data off the device in readable form. The app does not do this:

- Health diary data (urination, fluid, leak entries) stays in AsyncStorage on the device
- The app makes no network requests and does not write to iCloud
- Data leaves the device only through user-initiated exports and backup files (see below), or inside the device backup the operating system makes under the user's own settings

Result: "Data Not Collected" for all categories. iOS device backups (iCloud Backup or a computer backup) may include the app's local data under the user's own settings; these are made by iOS, not by the app.

#### User-Initiated Exports (Not Disclosed)

Per Apple's guidance, data sent off-device only:

1. At user's explicit direction
2. To a destination chosen by the user

...does not need to be disclosed as "collection."

Our PDF/CSV/JSON exports and the local backup file meet both criteria → **Not disclosed**

---

## Google Play Store Disclosures

### Data Safety Form Mapping

| Google Category          | Data Type   | Collected?    | Shared? | Purpose           | Rationale                                          |
| ------------------------ | ----------- | ------------- | ------- | ----------------- | -------------------------------------------------- |
| **Health & fitness**     | Health info | ⚠️ Optional\* | No      | App functionality | \*Conservative disclosure for local health logging |
| Location                 | (all)       | No            | No      | —                 | Not used                                           |
| Personal info            | (all)       | No            | No      | —                 | Not collected                                      |
| Financial info           | (all)       | No            | No      | —                 | Not collected                                      |
| Messages                 | (all)       | No            | No      | —                 | Not collected                                      |
| Photos and videos        | (all)       | No            | No      | —                 | Not collected                                      |
| Audio files              | (all)       | No            | No      | —                 | Not collected                                      |
| Files and docs           | (all)       | No            | No      | —                 | Not collected                                      |
| Calendar                 | (all)       | No            | No      | —                 | Not collected                                      |
| Contacts                 | (all)       | No            | No      | —                 | Not collected                                      |
| App activity             | (all)       | No            | No      | —                 | Not collected                                      |
| Web browsing             | (all)       | No            | No      | —                 | Not collected                                      |
| App info and performance | (all)       | No            | No      | —                 | Not collected                                      |
| Device or other IDs      | (all)       | No            | No      | —                 | Not collected                                      |

#### Health Info Disclosure Rationale

**Conservative approach:** Even though Android version stores data locally only, health apps receive extra scrutiny. Disclosing "Health info" as collected (for app functionality) is the safer choice.

**Alternative approach:** Could argue for "Data not collected" since:

- No data transmitted to developer servers
- No third-party services receive data
- The app has no cloud backup of its own

**Android Auto Backup:** With `android.allowBackup: true`, Android may copy the app's local data to the user's Google account when the user has device backup turned on. This is done by the OS, not by app code. Whether it affects the Data safety answers is an open item for the owner (see `app-stores/google/data-safety-answers.md`).

#### Security Practices

| Practice                  | Answer    | Implementation                                    |
| ------------------------- | --------- | ------------------------------------------------- |
| Data encrypted in transit | Yes (N/A) | No server transmission; OS handles export sharing |
| Data deletion available   | Yes       | Settings → Clear All Data                         |

### Health Apps Declaration

| Question                            | Answer | Notes                   |
| ----------------------------------- | ------ | ----------------------- |
| Is app a health/fitness tracker?    | Yes    | Primary function        |
| Is app a medical device?            | No     | Logging tool only       |
| Is app regulated as medical device? | No     | Not in any jurisdiction |

---

## Legal Document Requirements

### Privacy Policy

| Requirement               | Implementation                            | Section      |
| ------------------------- | ----------------------------------------- | ------------ |
| Controller identification | Buzios e Tartarugas, Lda.                 | Introduction |
| Contact information       | privacy@eleva.care                        | Introduction |
| Data types processed      | Health diary entries                      | Section 2    |
| Storage location          | Local device, backup files, OS backups    | Sections 2-3 |
| Third-party sharing       | None                                      | Section 5    |
| User rights               | Access, correction, deletion, portability | Section 10   |
| Data retention            | User-controlled                           | Section 7    |
| Deletion method           | Clear All Data in Settings                    | Section 7    |
| Children's data           | Not directed at under-13                  | Section 8    |
| International transfers   | None (local storage)                      | Section 9    |

### Terms of Use

| Requirement             | Implementation              | Section      |
| ----------------------- | --------------------------- | ------------ |
| Service description     | Bladder diary app           | Section 2    |
| Medical disclaimer      | Not a medical device        | Section 3    |
| User responsibilities   | Data accuracy, backup       | Section 4    |
| Intellectual property   | License grant, restrictions | Section 6    |
| Limitation of liability | Standard clauses            | Sections 8-9 |
| Governing law           | Portugal                    | Section 13   |

### Privacy Choices / Data Deletion

| Requirement        | Implementation                  | Section          |
| ------------------ | ------------------------------- | ---------------- |
| How to access data | View in app, export             | Export section   |
| How to delete data | Clear All Data in Settings          | Deletion section |
| Backup and restore | Export/import backup file       | Backup section   |
| Account deletion   | N/A (no accounts)               | —                |

---

## Health Disclaimer Requirements

### In-App Disclaimer

**Required text (must be visible in app):**

> Eleva Diary is a personal logging tool, not a medical device. It does not diagnose, treat, cure, or prevent any disease or health condition. Always consult a qualified healthcare provider for medical advice.

**Placement options:**

- Settings → About → Medical Disclaimer
- Onboarding screen (optional)
- Within settings area

### Store Listing Disclaimer

**Required in App Store / Play Store descriptions:**

> MEDICAL DISCLAIMER: Eleva Diary is a personal logging tool, not a medical device. It does not diagnose, treat, or prevent any condition. Always consult a qualified healthcare professional for medical advice.

---

## Verification Checklist

Before each app submission, verify:

### Code Review

- [ ] No analytics SDK imports (Firebase Analytics, Amplitude, Mixpanel, etc.)
- [ ] No crash reporting or performance monitoring imports (Sentry, Crashlytics, etc.)
- [ ] No ad SDK imports
- [ ] No third-party auth imports
- [ ] No network calls from app code (except user-initiated sharing)
- [ ] AsyncStorage is only local storage mechanism
- [ ] No iCloud entitlement or iCloud storage APIs
- [ ] Notifications are local scheduled reminders only (no push token requested)

### Feature Check

- [ ] Local backup file export and import work on iOS and Android
- [ ] Android Auto Backup (`android.allowBackup`) and its disclosure reviewed
- [ ] Clear All Data function works correctly
- [ ] Export generates files locally before sharing
- [ ] No automatic data transmission on app launch

### Store Listing

- [ ] Medical disclaimer present in description
- [ ] Privacy policy URL accessible
- [ ] Support URL accessible
- [ ] Age rating matches app content

---

## Change Log

When app features change, update this document and review all disclosure implications.

| Date        | Change                                                                                                                                                  | Disclosure Impact                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Feb 2026    | Initial documentation                                                                                                                                   | —                                                                                                                |
| 11 Nov 2026 | Removed optional iCloud backup/restore (Guideline 5.1.3(ii)) and Sentry crash reporting, performance tracing and session replay; local backup file kept | Apple label: Data Not Collected; legal documents and store texts updated; Android Auto Backup flagged for review |
| (Future)    | [Feature]                                                                                                                                               | [Impact assessment]                                                                                              |

---

## References

- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/10632613)
