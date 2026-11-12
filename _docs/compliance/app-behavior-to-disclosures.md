# Eleva Diary — App Behaviour to Disclosures Mapping

> **Last updated:** 11 November 2026
> **Purpose:** Single source of truth linking what the app does to what the store declarations and legal texts say. When the app changes, update this file first, then every document it points to.

Covers: the Apple App Store and Google Play declarations (`_docs/app-stores/**`) and the legal texts (`privacy-policy`, `privacy-choices` and `terms.eleva-diary.{en,es,pt}.md` in the website repo, see `_docs/legal-moved.md`), published at https://diary.eleva.care/privacy, https://diary.eleva.care/privacy-choices and https://diary.eleva.care/terms.

---

## Company and contacts

| Item | Value |
| ---- | ----- |
| Company | BÚZIOS E TARTARUGAS - LDA, sociedade por quotas; brand Eleva.care; product Eleva Diary |
| Registration | NIPC 515001708; registered at the Conservatória do Registo Comercial de Cascais; share capital €200.00 |
| Registered office | Rua Gil Vicente 2, 2775-198 Parede, Portugal |
| Support and general questions | support@eleva.care (also the store contact and App Review contact) |
| Data protection requests | privacy@eleva.care |
| Legal notices and complaints | legal@eleva.care |
| Data protection officer | Being appointed; no name or address published yet; privacy@eleva.care meanwhile |
| Supervisory authority | CNPD, Comissão Nacional de Proteção de Dados, Av. D. Carlos I, 134, 1.º, 1200-651 Lisboa, https://www.cnpd.pt |
| Legal URLs (the only ones to use) | https://diary.eleva.care/privacy · https://diary.eleva.care/terms · https://diary.eleva.care/privacy-choices |
| Website | https://diary.eleva.care (App Store Marketing URL, Google Play website): a short product page and the legal pages in PT, EN and ES at language paths (`/pt/privacy`, `/en/terms`, `/es/privacy-choices`…); the paths without a language redirect by the browser's language; the app opens `/{en,es,pt}/{page}` in its own language (`constants/legal.ts`) |
| Website hosting | Vercel Inc., Eleva team account, served from Vercel's global edge network; processor under Vercel's DPA; transfers: EU-US DPF (Vercel certified, verified on the DPF list 11 Nov 2026) + SCCs. No cookies, analytics, tracking, forms, or third-party scripts or fonts. Vercel request logs (IP address, user agent, URL, time) kept up to 30 days (3 days by default on Enterprise, up to 30 with extended observability). A short-lived security cookie only if Vercel's attack protection challenges a visitor (strictly necessary, Lei 41/2004 art. 5) |
| Mailboxes | support@, privacy@ and legal@eleva.care on Apple iCloud Mail (MX `mx01.mail.icloud.com`, `mx02.mail.icloud.com`; SPF `include:icloud.com`). iCloud is provided in the EU by Apple Distribution International Ltd. (Ireland); Apple's privacy policy says its EEA transfers are governed by SCCs; Apple Inc. is not on the DPF list. No processor agreement claimed (see owner actions) |
| Automated email | Resend (Plus Five Five, Inc.), sending domain notifications.eleva.care, region eu-west-1 (Ireland) with primary processing in the US; processor under Resend's DPA; EU-US DPF + SCCs. Eleva Diary sends no automated emails |

Never use diary@eleva.care, dpo@eleva.care, or the marketplace's eleva.care/privacy and eleva.care/terms as the diary's documents.

---

## Product decisions (the build must ship these)

The store answers below hold only for a build that includes all of them.

| # | Decision | Disclosure impact |
| - | -------- | ----------------- |
| 1 | Fluid Balance card keeps only neutral totals: fluid intake and estimated output. No ratio, no "Normal/Low/High", no traffic-light colours. | Needed for "not a medical device" (Apple declaration "No", Google "Health and fitness"); no interpretation of physiological data against thresholds. |
| 2 | Trend arrows are neutral (no green/red value judgement). | Same. |
| 3 | The only goal is an optional daily fluid target the user sets themselves. The app starts with no target (since 12 Nov 2026; a default amount read as a recommended intake); "Set a target" starts from the user's own 7-day average, or 1500 ml without drinks, to adjust or remove; no text calls it a medical norm or guideline. The summary's goal stat is "Fluid goal reached" / "Objetivo de líquidos alcanzado" / "Objetivo de líquidos atingido" (days on which the fluid goal was reached). | Same; terms, policy and store listings describe it as a daily fluid goal the user sets themselves. |
| 4 | Onboarding and store wording are neutral: a personal bladder diary to keep a record and share it with a health professional. No "insights", "improve your bladder health", "healthy habits", no named conditions in descriptions. | Store listings, release notes, screenshots and website follow it. Keywords may keep search terms. |
| 5 | Medical disclaimer in onboarding, in Settings > Medical information (About section), under the charts, and in the PDF footer. Exact text below. | Apple 1.4.1; Google Health Content and Services policy; review notes list the four places. |
| 6 | Onboarding's last page shows the acceptance line with links to both documents. It has no "have read" statement (DL 446/85 art. 21(e)): EN "By continuing, you accept the Terms of Use. See how your data is handled in the Privacy Policy." ES "Al continuar, aceptas los Términos de uso. Consulta cómo se tratan tus datos en la Política de privacidad." PT "Ao continuar, aceita os Termos de Utilização. Veja como os seus dados são tratados na Política de Privacidade." Skip leads to the last page; acceptance happens only with that page's main button (Get Started / Empezar / Começar). The app stores the accepted terms version and date on the device. When `TERMS_VERSION` changes, the app shows a prompt on launch with a link to the Terms and an Accept button; until the user accepts, the previous version applies. | Terms are presented before use; Terms §3 and §12 and privacy policy §3 and §15 describe this; the stored version and date is device data listed in the privacy policy. |
| 7 | Android: `allowBackup` stays true with backup rules allowing cloud backup only when end-to-end encrypted (`disableIfNoEncryptionCapabilities`; `requireFlags="clientSideEncryption"` on Android 9–11). Device-to-device transfer stays allowed on Android 9 and later. On Android 7–8.1 nothing is backed up or transferred. iOS: the diary is **not** in iCloud or computer backups: `@react-native-async-storage/async-storage` 2.2.0 excludes its storage folder from backup by default (`RNCAsyncStorage.mm`; `RCTAsyncStorageExcludeFromBackup` is not set in `app.json` or any plugin). This stays as it is; users move the diary to a new iPhone with Export/Import Backup File. | Supports Google Data safety "No data collected"; privacy policy and privacy choices describe both platforms. Setting `RCTAsyncStorageExcludeFromBackup` to false would make every iOS statement wrong. |
| 8 | Installed app name becomes "Eleva Diary" (was "Pee Diary"). | Matches both store names (Apple 2.3.8). |
| 9 | Reminder notification text becomes neutral ("Time to update your diary"). | Lock screen does not reveal the health topic; policy describes reminders. |
| 10 | Edit history stays in entries, JSON exports and backup files. | Disclosed in the privacy policy and privacy choices ("what is included in exports"). |
| 11 | App labels quoted exactly in the documents (table below). | All documents. |

### Medical disclaimer (exact in-app text)

| Language | Text |
| -------- | ---- |
| EN | Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms. |
| ES | Eleva Diary es un diario personal. No es un producto sanitario y no diagnostica, trata, cura ni previene ninguna afección. Consulta a un profesional de la salud sobre tus síntomas. |
| PT | O Eleva Diary é um diário pessoal. Não é um dispositivo médico e não diagnostica, trata, cura nem previne qualquer doença. Fale com um profissional de saúde sobre os seus sintomas. |

Store descriptions use the same texts; the English store text reads "...does not diagnose, treat, cure, or prevent any medical condition..." to match Google's required wording exactly.

### App labels (EN | ES | PT)

| EN | ES | PT |
| -- | -- | -- |
| Settings | Ajustes | Definições |
| Privacy Policy | Política de privacidad | Política de Privacidade |
| Terms of Use | Términos de uso | Termos de Utilização |
| Privacy Choices (row description: How to delete your data) | Opciones de privacidad (Cómo eliminar tus datos) | Escolhas de Privacidade (Como eliminar os seus dados) |
| Medical information | Información médica | Informação médica |
| Clear All Data | Borrar todos los datos | Apagar todos os dados |
| Export Data | Exportar datos | Exportar dados |
| Local Backup | Copia local | Cópia local |
| Export Backup File | Exportar copia de seguridad | Exportar cópia de segurança |
| Import Backup File | Importar copia de seguridad | Importar cópia de segurança |
| Reminders | Recordatorios | Lembretes |
| History | Historial | Histórico |
| Today | Hoy | Hoje |
| Delete | Eliminar | Eliminar |

---

## App feature inventory

### What the app stores on the device

All in AsyncStorage (key `pee-diary-storage`) in the app's private storage. The app adds no encryption of its own; the phone's own storage encryption protects it when the user has a passcode, PIN or screen lock.

| Data | Details | Leaves the device? |
| ---- | ------- | ------------------ |
| Bathroom visits | Date and time, volume (small/medium/large) or exact ml, urgency 1–5, leak yes/no, pain yes/no, notes | Only in exports, backup files and Android backups or device-to-device transfers (never in iOS backups) |
| Drinks | Date and time, type, amount, notes | Same |
| Leaks | Date and time, amount (severity), urgency, activity (optional), notes | Same |
| Edit history | For each edit, the previous and new value of every changed field, notes included | Same; included in JSON exports and backup files |
| Fluid goal and its history | The daily fluid goal the user sets themselves, and its changes | Same |
| Streak | Days in a row with entries | Same |
| Reminder settings | On/off, interval, quiet hours | Same |
| Preferences | Language, onboarding completed, open add menu on launch | Same |
| Terms acceptance | Accepted terms version and date (decision 6) | Same |

### What the app shows

| Feature | Description |
| ------- | ----------- |
| Today | Daily totals of drinks, bathroom visits and leaks; fluid card with intake and estimated output totals only; streak |
| Charts | Simple weekly and monthly charts of logged entries, neutral trend arrows, disclaimer line underneath |
| History | Calendar with entries; open an entry to edit it or tap Delete |
| Goal | A daily fluid goal the user sets themselves; the summary shows on how many days it was reached ("Fluid goal reached") |
| Medical information | Settings > About > Medical information shows the disclaimer |

### Exports and backup files (user-initiated)

| Feature | Format | Destination | Notes |
| ------- | ------ | ----------- | ----- |
| Export Data | PDF, CSV, JSON | Share sheet, user chooses | PDF footer carries the disclaimer; JSON includes edit history |
| Export Backup File | JSON | Share sheet, user chooses | Entries (with edit history), fluid goal and its history, streak, language |
| Import Backup File | JSON | From a file the user picks | Replaces the current data after confirmation |

Export and backup files are written to the app's cache folder and deleted at launch, before each export and by Clear All Data. Files the user has already sent elsewhere are outside the app's control and are not encrypted.

### Reminders

Local notifications scheduled on the device. The app asks for notification permission only when the user turns on Reminders. No push token is requested or sent. Neutral text (decision 9). Turned off in Settings > Reminders or in the phone's settings; Clear All Data cancels them.

### Deletion

| Action | Effect |
| ------ | ------ |
| Delete an entry | Open the entry, tap Delete, confirm |
| Clear All Data | Deletes entries, the fluid goal and its history, the streak, reminder settings, the launch preference and export/backup files; cancels reminders. Keeps the language and the completed onboarding. Confirm by typing DELETE. |
| Uninstall | Removes the app's data from the phone. On Android, the last backup stays in the user's Google account until the user deletes it there or Google removes it under its own rules, and reinstalling can restore the diary from it. On iOS, no device backup holds the diary; only an exported backup file can bring it back |

### Operating-system backups (not app features)

| Platform | Behaviour | Controlled by |
| -------- | --------- | ------------- |
| iOS | The diary is excluded from iCloud Backup and computer backups (AsyncStorage default) and is not restored from them. Export and backup files are in the cache folder, which is never backed up. The app does not write to iCloud. A direct iPhone-to-iPhone transfer (Quick Start) is untested: the documents only say Eleva cannot guarantee the diary comes across and that the backup file is the reliable way. | The library default; do not change it without rewriting the documents |
| Android 9+ | Auto Backup may copy the app's data to a private folder in the user's Google Drive, only when end-to-end encrypted (decision 7). Restored on reinstall or new-phone setup. After Clear All Data, the earlier backup is replaced at the next backup (about once a day when idle and on Wi-Fi). After uninstalling, the last backup stays in the user's Google account until the user deletes it or Google removes it under its own rules. Device-to-device transfer allowed. | The user's Android settings; Google's terms |
| Android 7–8.1 | Backup rules exclude everything: no cloud backup and no device-to-device transfer. | The app's backup rules |

Eleva cannot see or delete these backups.

### Not present

| Feature | Present? |
| ------- | -------- |
| Accounts, sign-in, third-party login | No |
| Network requests from the app | No (legal links open in the browser) |
| Analytics, advertising, tracking, crash reporting, performance tracing | No |
| iCloud storage, HealthKit | No |
| Remote sync or server storage | No |
| Push notifications | No (local reminders only) |
| Payments or in-app purchases | No |

---

## What Eleva receives (outside the app)

The app sends nothing to Eleva. Eleva does receive or process the following, which the privacy policy covers with a full Article 13 GDPR notice:

| Source | Data | Purpose and legal basis | Retention |
| ------ | ---- | ----------------------- | --------- |
| Emails to support@, privacy@ or legal@ (received and stored in Apple iCloud Mail; Eleva's automated emails, none from the diary, go through Resend) | Email address, name if given, message content. The policy asks users not to send health details and promises that any it receives are seen only by the people handling the request and deleted from the mailbox once the matter is resolved (an operational procedure is needed; Art. 9(2) condition pending lawyer) | Answering the user: legitimate interest (Art. 6(1)(f)); data protection requests: legal obligation (Art. 6(1)(c), Art. 12) | 3 years after the last contact, unless longer is needed to defend a claim |
| Website diary.eleva.care (Vercel) | IP address, user agent, requested URL and time in Vercel's request logs; a short-lived security cookie only when Vercel's attack protection challenges the visitor | Delivering and securing the site: legitimate interest (Art. 6(1)(f)); Vercel as processor (DPA; DPF + SCCs); the security cookie is strictly necessary (Lei 41/2004 art. 5) | Up to 30 days |
| Apple and Google | Aggregated statistics; crash reports from users who agreed to share them with developers; store reviews and the name they are posted under | Fixing problems and replying to reviews: legitimate interest (Art. 6(1)(f)); Apple and Google act as independent controllers | Held by Apple and Google under their terms |

---

## Store declarations

| Store | Question | Answer | Why | File |
| ----- | -------- | ------ | --- | ---- |
| Apple | App Privacy: do you or your partners collect data from this app? | **No → "Data Not Collected"** (all categories, Health & Fitness included) | Apple's "collect" means transmitting data off the device so that the developer or its partners can access it; the app transmits nothing; exports go only where the user sends them; the diary is excluded from iCloud and computer backups (AsyncStorage default), so no Apple backup carries it | `app-stores/apple/app-privacy-answers.md` |
| Apple | Regulated medical device (EU/EEA, UK, US) | **No, for every region** | Holds because of decisions 1–5: no interpretive features, no clinical norms, neutral wording, disclaimer | `app-stores/apple/metadata.en.md` |
| Apple | Category | **Health & Fitness; no secondary category** (Lifestyle if one is ever wanted; never Medical) | Medical would signal a medical purpose and contradict the declaration | `app-stores/apple/metadata.en.md` |
| Apple | Age rating | **4+**; medical or treatment information: None | The app gives no medical or treatment information | `app-stores/apple/metadata.en.md` |
| Apple | Licence | **Apple's Standard EULA** (no custom EULA for now); the Terms of Use add to it, and Terms §5 states that, between the user and Eleva, the Terms apply where the two differ | Decision in the legal positions; consumer review | `app-stores/apple/metadata.en.md` |
| Google | Data safety: does your app collect or share any required user data types? | **No → "No data collected" / "No data shared with third parties"** | On-device data is not collected; exports are user-initiated transfers; Auto Backup is Android's end-to-end-encrypted backup in the user's own Google account that Eleva cannot read (decision 7) | `app-stores/google/data-safety-answers.md` |
| Google | Health apps declaration | **Health and fitness** (not Medical, not SaMD, not a regulated medical device) | The user records their own health information; no medical function | `app-stores/google/health-apps-declaration-notes.md` |
| Google | Category, tags | **Health & Fitness**; tags such as Health tracker, Diary, Health journal; no "Medical log" | | `app-stores/google/metadata.en.md` |
| Google | Target audience | **18 and over** | App is for adults; under-16s only with a parent or guardian | `app-stores/google/metadata.en.md` |
| Both | Privacy policy URL | https://diary.eleva.care/privacy | | |
| Both | Store contact | support@eleva.care | | |
| Both | Availability | EU/EEA (owner to confirm list) | Legal texts are written for the EU/EEA | |
| Both | EU Digital Services Act trader status | Declared, with company address, support@eleva.care and a company phone number | | `app-stores/assets-checklist.md` |

Listing localisations: English, Spanish (Spain) and Portuguese (Portugal) on both stores.

---

## Legal documents: what they must say

### Privacy Policy and Privacy Choices

| Topic | Position |
| ----- | -------- |
| Role | Follow the GDPR expert's wording: the diary is processed only on the user's phone, by the user and for the user (household use); Eleva does not receive or access it and cannot see, change or delete it. Do not say "GDPR does not apply" or "we are the controller of your health data". Eleva is responsible only for what it receives (above). *Lawyer sign-off pending.* |
| Article 13 notice | Full notice for emails, store data and the website (§11): who we are, DPO status, purposes, legal bases, recipients (mailboxes on Apple iCloud Mail, provided in the EU by Apple Distribution International Ltd., with no processor claim; Resend as processor for Eleva's automated emails, which the diary does not send; Vercel as processor hosting the website; Apple and Google as independent controllers for store data), transfers (Apple: SCCs according to Apple's privacy policy; Resend and Vercel: EU-US DPF + SCCs), retention (emails 3 years after last contact; website logs up to 30 days), rights, CNPD complaint, no automated decisions |
| Website | Policy §11.3: no cookies, analytics, tracking, forms, or third-party scripts or fonts; Vercel request logs for delivery and security, legitimate interest, up to 30 days; the security cookie only under Vercel's attack protection, strictly necessary (Lei 41/2004 art. 5); retention table row in §12 |
| Data on the device | The complete inventory above, including edit history, accepted terms version and date, and reminder settings |
| Security | The app adds no encryption; the phone's own encryption protects it when a screen lock is set; export and backup files are not encrypted. Never "secure local storage" or an unqualified "encrypted" |
| Exports and backups | User-initiated; the user chooses the destination; JSON exports and backup files include edit history |
| Device backups | iOS: not included in iCloud or computer backups, not restored from them; move with Export/Import Backup File; no promise about direct iPhone-to-iPhone transfer. Android 9+: encrypted-only cloud backup and device-to-device transfer, restore on reinstall, delay after Clear All Data, copy kept after uninstall until the user deletes it or Google removes it. Android 7–8.1: nothing backed up or transferred |
| Reminders | Local only, permission asked when turned on, neutral text, how to turn off |
| Deletion | Delete an entry; Clear All Data (exact scope); uninstall; removing Android backups in the Google account; exact app labels |
| Children | Adults; someone under 16 may use the app with a parent or guardian, who can keep the diary for a child |
| Contacts | privacy@eleva.care for data protection; support@eleva.care; DPO being appointed; CNPD details |
| Changes | Material changes published on the page and in release notes before they take effect, plus an in-app notice when the change comes with an app update; Terms changes follow the Terms' own prompt; no "continued use is acceptance" |
| Must not say | Any non-EU legal or regulatory framework; "your data never leaves your device"; "Eleva Diary is part of the Eleva Care platform"; unverifiable compliance claims |

### Terms of Use

| Topic | Position |
| ----- | -------- |
| Identification | Full company details above |
| Acceptance | Last onboarding page, which Skip leads to; accepted only with Get Started; acceptance line without a "have read" statement (decision 6); accepted version and date stored on the device |
| Purpose and disclaimer | A personal diary to keep a record and share it with a health professional; not a medical device; the disclaimer text above |
| Licence | Personal, free, for as long as the user keeps the app |
| Apple | Apple's Standard EULA applies to App Store downloads; the Terms add to it and, between the user and Eleva, apply where the two differ (liability as in §11, not the EULA's exclusion or USD 50 cap) |
| Liability | Consumer-compliant: liability as the law provides; nothing limits liability for death or personal injury, fraud, wilful misconduct or gross negligence, or the consumer's mandatory rights. No exclusion of "health consequences", no monetary cap. *Lawyer sign-off pending.* |
| Removed clauses | Indemnification; assignment without restriction |
| Changes | In-app prompt on launch when `TERMS_VERSION` changes, with a link and an Accept button; the previous version applies until the user accepts; unfavourable changes take effect only once accepted and never earlier than 30 days after the notice; continued use is never acceptance; earlier versions stay available at https://diary.eleva.care/terms |
| Governing law and courts | Portuguese law, without removing the consumer's mandatory home-country protections; consumers may sue in their home courts |
| Complaints and disputes | legal@eleva.care; Livro de Reclamações Eletrónico (https://www.livroreclamacoes.pt); RAL entities CACCL (Lisboa, https://www.centroarbitragemlisboa.pt) and CNIACC (https://www.cniacc.pt); no EU ODR link (platform closed 20 July 2025) |
| Age | Adults; under 16 with a parent or guardian, who can keep the diary for a child |
| Territory | Written for the EU/EEA under Portuguese law; no claim of worldwide availability |

### All legal texts

| Topic | Position |
| ----- | -------- |
| Language | Portuguese (pt-PT) is the reference text; EN and ES say the same. Monorepo rule, stated the same way in each language: "Em caso de divergência entre versões linguísticas, prevalece a versão em português." |
| Dates | "Last updated: 11 November 2026" in each language's date style; no invented effective date; the text applies from its publication on diary.eleva.care |
| Style | pt-PT (utilizador, telemóvel, ficheiro, registo, partilhar, cópia de segurança, aplicação); Spain Spanish with tú; plain second-person writing |

---

## Store listing wording rules

- Describe a personal bladder diary to keep a record and share it with a health professional.
- No named conditions in names, subtitles, promotional text, short or full descriptions, release notes, screenshots or the website. Keywords may keep search terms such as "incontinence"; they are not shown to users.
- Never: "insights", "analyse/analyze", "trends", "patterns", "personalised", "improve your health", "healthy habits", "normal range", "medical guidelines", health-benefit or clinical claims.
- Every full description ends with the disclaimer; English uses Google's exact phrase "not a medical device and does not diagnose, treat, cure, or prevent any medical condition".
- Contact: support@eleva.care only.

---

## Verification before each submission

### Build

- [ ] Product decisions 1–11 are in the build being submitted
- [ ] No analytics, advertising, tracking, crash-reporting or third-party auth packages
- [ ] No network calls from app code; legal links open in the browser
- [ ] AsyncStorage is the only storage; no iCloud or HealthKit entitlement
- [ ] Notifications are local only; no push token requested
- [ ] Inspect the release build's merged Android manifest (backup rules from decision 7 present) and iOS entitlements (`aps-environment` from `expo-notifications` acceptable only because no push token is requested)
- [ ] No `google-services.json`, so Firebase is never initialised
- [ ] Run the release build behind a network proxy for a full session (launch, onboarding, logging, reminders, export, backup, Clear All Data): no traffic except the browser loading diary.eleva.care
- [ ] Installed app name is "Eleva Diary" on iOS and Android

### Features

- [ ] Disclaimer visible in onboarding (cannot be skipped past: Skip leads to the last page, which shows it), Settings > Medical information, under the charts and in the PDF footer
- [ ] Onboarding's last page shows the acceptance line (decision 6 wording, no "have read"); only Get Started records acceptance; the version and date are stored
- [ ] Terms update prompt: with a stored `termsAcceptedVersion` older than `TERMS_VERSION`, launch shows the notice with the Terms link and Accept; Accept records the new version and date; the diary stays usable before accepting
- [ ] iOS: the built Info.plist has no `RCTAsyncStorageExcludeFromBackup`; an iCloud backup and restore on a test iPhone does not bring the diary back; record what a Quick Start transfer does
- [ ] Android: backup rules verified with `bmgr` on Android 12+, 9–11 and 7–8.1, with and without a screen lock; uninstall and reinstall behaves as the privacy policy says
- [ ] Export and backup files use the share sheet; import uses the system picker; files are deleted at launch, before each export and by Clear All Data
- [ ] Clear All Data deletes and keeps exactly what the documents say

### Pages and listings

- [ ] https://diary.eleva.care, /privacy, /terms and /privacy-choices are live in EN, ES and PT (`/pt/…`, `/en/…`, `/es/…`; the paths without a language redirect by browser language)
- [ ] The site sets no cookies and loads nothing from third parties (check the response headers and the browser's network panel), and Vercel log retention on the Eleva team is at most 30 days
- [ ] support@, privacy@ and legal@eleva.care are monitored
- [ ] Store descriptions carry the disclaimer; screenshots show the current build
- [ ] Store declarations match the table above

---

## Owner actions outside these documents

- Commission a short written intended-purpose and MDR qualification note, signed off by a regulatory adviser, once the product changes ship, and keep it on file.
- Have a Portuguese lawyer sign off the role wording, the liability clause and the governing-law and courts clause.
- Apple iCloud Mail for support@, privacy@ and legal@: the iCloud terms say the service is "designed and intended for personal use on an individual basis" and offer no processor terms; Apple's processor terms (Article 28 GDPR) are in the Apple Business terms of service for its Managed Services, which include email. Check which one the eleva.care mailboxes use and, with a lawyer, either move them under Apple Business terms (or another provider with a GDPR processor agreement) or confirm the current setup. The privacy policy names iCloud Mail without claiming a processor contract; update §11.1 if the setup changes.
- Confirm the EU/EEA country list and provide a company phone number for the stores' trader details.
- Publish each version of the Terms at a permanent address (Terms §12 promises that earlier versions stay available at https://diary.eleva.care/terms, each with its date), and decide whether the app should open a version-specific URL (it already opens the page in its own language).
- Decide whether to bundle the Terms and Privacy Policy as offline in-app screens (incorporation when the phone is offline at first launch).
- Set up the procedure that deletes health details received by email once a matter is resolved (privacy policy §4).
- Decide on a custom Apple EULA (with a published phone number) instead of the Standard EULA plus the precedence wording in Terms §5.

---

## Change log

When app features change, update this document and review every disclosure it affects.

| Date | Change | Disclosure impact |
| ---- | ------ | ----------------- |
| Feb 2026 | Initial documentation | — |
| 11 Nov 2026 | Removed optional iCloud backup/restore (Guideline 5.1.3(ii)) and Sentry crash reporting, performance tracing and session replay; local backup file kept | Apple label: Data Not Collected; legal documents and store texts updated; Android Auto Backup flagged for review |
| 11 Nov 2026 | Legal review decisions adopted: product decisions 1–11 (neutral fluid totals and trend arrows, user's own goals, neutral wording, disclaimer in four places, terms acceptance in onboarding, encrypted-only Android cloud backup, app name "Eleva Diary", neutral reminder text, edit history disclosed, exact labels); diary-specific URLs and verified contacts; pt-PT and Spain Spanish texts | Apple: Data Not Collected; regulated medical device "No" for every region; no secondary category. Google: Data safety "No data collected / No data shared" (replaces the "Health info collected" proposal); Health apps declaration "Health and fitness". Store listings, review notes, release notes and screenshots rewritten in neutral wording with the disclaimer; privacy policy gains an Article 13 notice for emails and store data; terms rewritten to consumer-compliant wording |
| 11 Nov 2026 | Second review: iOS diary confirmed excluded from iCloud and computer backups (AsyncStorage default, kept); Android 7–8.1 excluded from backup and transfer; acceptance line without "have read", Skip leads to the last page, acceptance only with Get Started; Terms update prompt with Accept button | Privacy policy, privacy choices and terms rewritten on backups, moving phones, uninstalling, acceptance and changes; Terms §5 states the Terms prevail over Apple's Standard EULA between user and Eleva; Apple App Privacy, review notes, Data safety and health declaration notes updated |
| 11 Nov 2026 | Website facts (Vercel hosting, request logs up to 30 days, no cookies apart from Vercel's security cookie under attack protection, language paths); email facts (mailboxes on Apple iCloud Mail, Eleva's automated emails through Resend); goals reduced to a single daily fluid goal the user sets themselves, with the "Fluid goal reached" stat | Privacy policy: website section §11.3 (old §11.3 now §11.4), summary, intro, rights and retention table cover the website; §11.1 names iCloud Mail and Resend with their transfer bases. Goals described as a daily fluid goal the user sets themselves in the policy, privacy choices, terms, store listings, review notes, Data safety and App Privacy notes, health declaration notes and this file |
| (Future) | [Feature] | [Impact assessment] |

---

## References

- [Apple, App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple, Declare regulated medical device status](https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play, Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play, Health Content and Services policy](https://support.google.com/googleplay/android-developer/answer/16679511)
- [Google Play, Health app categories](https://support.google.com/googleplay/android-developer/answer/13996367)
- [Android Developers, Auto Backup](https://developer.android.com/identity/data/autobackup)
- [MDCG 2019-11 Rev.1](https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en)
- [Regulation (EU) 2017/745 on medical devices](https://eur-lex.europa.eu/eli/reg/2017/745/oj)
