# Eleva Diary — App Behavior to Disclosures Mapping

> **Last updated:** February 2026  
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
| Excel export | Native .xlsx format           | User-controlled (share sheet) | Yes             |

### Platform-Specific Features

| Feature        | Platform | Description                   | Data Destination              |
| -------------- | -------- | ----------------------------- | ----------------------------- |
| iCloud backup  | iOS only | Optional backup to iCloud KVS | Apple iCloud (user's account) |
| iCloud restore | iOS only | Restore data from iCloud      | From iCloud to device         |

### Non-Features (Not Present)

| Feature               | Present? | Notes                          |
| --------------------- | -------- | ------------------------------ |
| User accounts/login   | ❌ No    | No authentication required     |
| Analytics SDKs        | ❌ No    | No Firebase, Amplitude, etc.   |
| Crash reporting       | ❌ No    | No Sentry, Crashlytics, etc.   |
| Advertising           | ❌ No    | No ad SDKs                     |
| Third-party auth      | ❌ No    | No Google/Apple/Facebook login |
| HealthKit integration | ❌ No    | No iOS HealthKit read/write    |
| Remote server sync    | ❌ No    | No proprietary cloud sync      |
| Push notifications    | ❌ No    | No remote push capability      |

---

## Apple App Store Disclosures

### App Privacy Label Mapping

| Apple Category       | Sub-category | Collected? | Linked to Identity? | Used for Tracking? | Rationale                         |
| -------------------- | ------------ | ---------- | ------------------- | ------------------ | --------------------------------- |
| **Health & Fitness** | Health       | ⚠️ Yes\*   | Yes\*               | No                 | \*Only via optional iCloud backup |
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

**Why we disclose Health data as "collected":**

Per Apple's definition, "collect" means transmitting data off the device in readable form. When a user enables iCloud backup:

- Health diary data (urination, fluid, leak entries) is transmitted to Apple's iCloud
- This data is linked to the user's Apple ID
- Therefore, we must disclose Health data as collected

**Purpose selection:**

- ✅ App Functionality (backup/restore)
- All other purposes: ❌ No

**If iCloud backup feature were removed:**

- Could declare "Data Not Collected" for all categories

#### User-Initiated Exports (Not Disclosed)

Per Apple's guidance, data sent off-device only:

1. At user's explicit direction
2. To a destination chosen by the user

...does not need to be disclosed as "collection."

Our PDF/CSV/JSON/Excel exports meet both criteria → **Not disclosed**

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
- Android version has no cloud backup

#### Security Practices

| Practice                  | Answer    | Implementation                                    |
| ------------------------- | --------- | ------------------------------------------------- |
| Data encrypted in transit | Yes (N/A) | No server transmission; OS handles export sharing |
| Data deletion available   | Yes       | Settings → Clear Data                             |

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
| Storage location          | Local device, optional iCloud             | Sections 2-3 |
| Third-party sharing       | None                                      | Section 5    |
| User rights               | Access, correction, deletion, portability | Section 10   |
| Data retention            | User-controlled                           | Section 7    |
| Deletion method           | Clear Data in Settings                    | Section 7    |
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
| How to delete data | Clear Data in Settings          | Deletion section |
| iCloud management  | Enable/disable, delete from iOS | iCloud section   |
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
- [ ] No crash reporting imports that collect PII (Sentry with user context, etc.)
- [ ] No ad SDK imports
- [ ] No third-party auth imports
- [ ] No network calls to non-Apple servers (except user-initiated sharing)
- [ ] AsyncStorage is only local storage mechanism
- [ ] iCloud backup uses only Apple's iCloud KVS API

### Feature Check

- [ ] iCloud backup is opt-in (disabled by default)
- [ ] Clear Data function works correctly
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

| Date     | Change                | Disclosure Impact     |
| -------- | --------------------- | --------------------- |
| Feb 2026 | Initial documentation | —                     |
| (Future) | Excel export added    | None (user-initiated) |
| (Future) | [Feature]             | [Impact assessment]   |

---

## References

- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/10632613)
