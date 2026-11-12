# Eleva Diary — Apple App Store Metadata (English)

> **Last updated:** 11 November 2026
> **Character limits:** Name (30), Subtitle (30), Promotional Text (170), Keywords (100), Description (4000), What's New (4000)
> **Counts below:** characters as App Store Connect counts them. Keywords are also given in UTF-8 bytes, because App Store Connect can reject a keyword field over 100 bytes even when it is under 100 characters.

Wording rules for every field (see `_docs/compliance/app-behavior-to-disclosures.md`): describe a personal bladder diary that keeps a record the user can share with a health professional. No named conditions in the name, subtitle, promotional text or description. Never use "insights", "analyse/analyze", "trends", "patterns", "personalised", "improve your health" or "healthy habits".

---

## App Name (30 characters max)

```
Eleva Diary
```

**Character count:** 11

The installed app shows the same name under its icon ("Eleva Diary", product decision 8), as Guideline 2.3.8 expects.

---

## Subtitle (30 characters max)

```
Your private bladder diary
```

**Character count:** 26

---

## Promotional Text (170 characters max)

> This text can be updated at any time without app review.

```
Keep a private bladder diary: log bathroom visits, drinks and leaks, and export a report to share with your health professional.
```

**Character count:** 128

---

## Keywords (100 characters max, comma-separated)

```
voiding log,bladder,urination,toilet,fluid intake,drinks,leaks,incontinence,pelvic floor,journal
```

**Character count:** 96 (96 bytes)

Keywords are search terms only and are not shown to users. They may include words people search for, such as "incontinence", even though the description names no condition. Do not repeat "Eleva" or "Diary": the app name is already indexed.

---

## Description (4000 characters max)

```
Eleva Diary is a simple, private bladder diary. Write down when you go to the toilet, what you drink and any leaks, then share the record with your doctor, nurse or physiotherapist if you choose.

WHAT YOU CAN RECORD
• Bathroom visits: time, size (small, medium or large) or an exact amount in ml, urgency from 1 to 5, whether there was a leak or pain, and notes
• Drinks: time, type (water, coffee, tea, juice, alcohol or other) and amount
• Leaks: time, amount, urgency, what you were doing and notes

YOUR DIARY AT A GLANCE
• Daily totals of drinks, bathroom visits and leaks
• Simple weekly and monthly charts of what you logged
• A daily fluid target you set yourself, if you want one
• A streak showing how many days in a row you have logged
• Optional reminders to update your diary

SHARE IT WHEN YOU CHOOSE
• Export your diary as a PDF, CSV or JSON file for the dates you pick
• Send it with your phone's share options: by email, in a messaging app or to a storage service you choose
• Save a backup file and import it again later, on the same phone or a new one

KEPT ON YOUR PHONE
• Your diary is stored on your phone. No account and no sign-in
• No ads, no analytics, no tracking
• Works offline
• Delete your diary at any time with Clear All Data in Settings

WHO IT IS FOR
Anyone who has been asked to keep a bladder diary, or who wants a simple record of bathroom visits and drinks to take to an appointment. Carers and parents can keep a diary for the person they look after.

Available in English, Spanish and Portuguese. Free, with no in-app purchases.

IMPORTANT
Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a health professional about your symptoms.

Made by Eleva.care. Questions? support@eleva.care
```

**Character count:** 1,811

The disclaimer paragraph uses Google's required wording ("not a medical device and does not diagnose, treat, cure, or prevent any medical condition") so that both stores carry the same text. It differs from the in-app disclaimer only by the words "medical" and the serial comma.

---

## What's New (Release Notes)

App Store Connect does not show a "What's New" field for the first version of an app. Use `release-notes-templates.md` from version 1.0.1 onwards.

---

## Category

**Primary:** Health & Fitness
**Secondary:** None

Why no secondary category: Health & Fitness already describes a bladder diary, and a second category adds little discoverability for this app. "Medical" must not be used: it signals a medical purpose, which the app does not have, and it would contradict the "not a regulated medical device" declaration below. If the owner later wants a secondary category, use **Lifestyle**, never Medical.

---

## App Store Regulations & Permits — Regulated Medical Device

Apple requires apps available in the EU/EEA, UK or US whose primary or secondary category is Health & Fitness or Medical to declare whether they are a regulated medical device in each region (App Store Connect > the app > General > App Information > App Store Regulations & Permits > Declare Regulated Medical Device; Account Holder or Admin role). The answer is shown on the product page.

**Answer: No, for every region listed (EU/EEA, UK, US).**

This answer holds because the build being submitted includes the product changes in `_docs/compliance/app-behavior-to-disclosures.md` ("Product decisions"): the Fluid Balance card shows only neutral totals (no ratio, no "Normal/Low/High", no traffic-light colours), trend arrows are neutral, the only goal is an optional daily fluid target the user sets themselves (none by default), with no claim that it is a medical norm, onboarding and store wording describe a personal diary, and the medical disclaimer appears on the last onboarding page (which Skip leads to), Settings > Medical information, under the charts and in the PDF footer. Do not submit a build that still has the output ratio or the "medical guidelines" goal text: with those features the "No" answer is not defensible under MDCG 2019-11 Rev.1.

Source: [Declare regulated medical device status](https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status).

---

## Age Rating

**Expected 4+** (record the rating App Store Connect calculates; do not change answers to reach a rating). Answer the questionnaire as follows: no violence, sexual content, profanity, gambling or user-generated content shared with others. If asked about medical or treatment information, answer **None**: the app records what the user enters and gives no medical or treatment information. (Answering "Frequent" would also be inaccurate.) If the questionnaire has a separate item on health or wellness topics, answer it truthfully (**Yes**: a bladder diary deals with a health topic); this does not change medical or treatment information, which stays **None**. Check the live questionnaire in App Store Connect when submitting, and record the answers given here (Guideline 2.3.6).

The age rating describes content. The Terms of Use say who the app is for: adults, and people under 16 with a parent or guardian, who can keep the diary for a child.

---

## Availability

Distribute in EU/EEA storefronts (owner to confirm the exact list). The legal texts are written for the EU/EEA under Portuguese law; do not make the app available worldwide without reviewing them first.

**EU Digital Services Act trader status:** declare BÚZIOS E TARTARUGAS - LDA as a trader in App Store Connect (Business section, Digital Services Act compliance). Apple shows the trader's address, phone number and email on the product page in the EU. Use the registered office (Rua Gil Vicente 2, 2775-198 Parede, Portugal), support@eleva.care and a company phone number the owner provides.

---

## Required URLs

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Privacy Policy | https://diary.eleva.care/privacy          |
| Support URL    | https://diary.eleva.care/en/support       |
| Marketing URL  | https://diary.eleva.care                  |

- **Support URL:** the Support page answers common questions (data, backups, deleting everything) and gives support@eleva.care, privacy@eleva.care and legal@eleva.care. Apple needs a web page here, not an email address.
- **Marketing URL:** the diary's home page. It must describe the app in the same neutral terms as this listing, show the medical disclaimer, give support@eleva.care and link to the three legal pages.
- All three pages must be live, public, not geofenced and not PDFs before submission. See `assets-checklist.md` for the full list of pages and addresses to publish.

---

## License Agreement

Leave Apple's Standard EULA in place (no custom EULA for now). The Terms of Use at https://diary.eleva.care/terms add to it, and section 5 of the Terms states that, between the user and Eleva, the Terms apply where the two differ (liability as in Terms section 11, not the Standard EULA's exclusion or USD 50 cap; the app does not collect the technical data the Standard EULA mentions). A custom EULA (these Terms plus Apple's minimum terms) remains the cleaner option; see the compliance mapping, owner actions.

---

## Localisations

| App Store Connect localisation | File                |
| ------------------------------ | ------------------- |
| English (U.K.)                 | `metadata.en.md`    |
| Spanish (Spain)                | `metadata.es.md`    |
| Portuguese (Portugal)          | `metadata.pt.md`    |

Use the Portugal and Spain localisations, not Portuguese (Brazil) or Spanish (Mexico): the texts are written in European Portuguese and Spain Spanish.

---

## App Privacy (Summary)

See `app-privacy-answers.md`.

- **Data Not Collected** (every category, Health & Fitness included)
- Privacy Policy URL: https://diary.eleva.care/privacy

---

## Notes for Review

See `review-notes.md`.
