# Eleva Diary — Google Play Health Apps Declaration

> **Last updated:** 11 November 2026
> **Sources (checked 11 November 2026):** [Google Play, Health Content and Services policy](https://support.google.com/googleplay/android-developer/answer/16679511); [Google Play, Health app categories and additional information](https://support.google.com/googleplay/android-developer/answer/13996367)

Every developer must complete the Health apps declaration (Play Console > App content > Health apps). This note gives Eleva Diary's answers.

---

## The answer

**Type of health app: Health and fitness.**

Google describes three types of health app: health and fitness apps (which "usually inform or let users track or sync information about their personal health and fitness"), medical apps (including Software as a Medical Device) and human subjects research apps. Eleva Diary lets users record their own bathroom visits, drinks and leaks, so it is a health and fitness app. In the form, select the health and fitness option that matches tracking the user's own health information.

Do **not** select:

- any Medical app feature (health care provider tools, telehealth, remote monitoring, disease management, symptom checking, medical reference);
- Software as a Medical Device, or "regulated medical device" status;
- human subjects research.

---

## Why the answer holds

Eleva Diary is a personal diary. It stores what the user enters, shows daily totals and simple charts of those entries, and exports them so the user can share them with a health professional. It does not interpret entries, tell the user whether results are normal, give health advice or monitor a condition, and it is not meant to be a medical device under Regulation (EU) 2017/745.

This is true of the build that ships the product decisions in `_docs/compliance/app-behavior-to-disclosures.md`:

- (Decision 1) Fluid Balance card: only neutral totals (fluid intake and estimated output). No ratio, no "Normal/Low/High", no traffic-light colours.
- (Decision 2) Trend arrows: neutral, with no green/red judgement.
- (Decision 3) Goals: the user's own targets. The 2000 ml / 7 visits defaults are editable starting values; no text calls them medical norms or guidelines.
- (Decision 4) Onboarding and store wording: a personal bladder diary to keep a record and share it with a health professional. No "insights", no "improve your bladder health", no "healthy habits", no named conditions in descriptions.
- (Decision 5) Medical disclaimer on the last onboarding page (Skip leads to that page, so it cannot be skipped past), in Settings > Medical information (About section), under the charts and in the PDF footer.
- (Decision 9) Neutral reminder text ("Time to update your diary").

Do not submit the declaration, or a build, while the output ratio or the "medical guidelines" goal text is still in the app: those features interpret the user's physiological data against reference values, which MDCG 2019-11 Rev.1 treats as a likely medical device function.

---

## Disclaimer in the store listing (required)

Google's Health Content and Services policy requires health apps that are not regulated as medical devices to state in the app description that the app is "not a medical device and does not diagnose, treat, cure, or prevent any medical condition". Each full description ends with an "IMPORTANT" paragraph:

- **EN:** "Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a health professional about your symptoms."
- **ES:** "Eleva Diary es un diario personal. No es un producto sanitario y no diagnostica, trata, cura ni previene ninguna afección. Consulta a un profesional de la salud sobre tus síntomas."
- **PT:** "O Eleva Diary é um diário pessoal. Não é um dispositivo médico e não diagnostica, trata, cura nem previne qualquer doença. Fale com um profissional de saúde sobre os seus sintomas."

The ES and PT texts are the in-app disclaimers (product decision 5 in `_docs/compliance/app-behavior-to-disclosures.md`). The EN store text adds "medical" before "condition" (and a serial comma) to match Google's wording exactly.

---

## Disclaimer in the app

Exact in-app text (product decision 5):

| Language | Text |
| -------- | ---- |
| EN | Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms. |
| ES | Eleva Diary es un diario personal. No es un producto sanitario y no diagnostica, trata, cura ni previene ninguna afección. Consulta a un profesional de la salud sobre tus síntomas. |
| PT | O Eleva Diary é um diário pessoal. Não é um dispositivo médico e não diagnostica, trata, cura nem previne qualquer doença. Fale com um profissional de saúde sobre os seus sintomas. |

Shown in: the last onboarding page, which every path reaches (Skip leads to it); Settings > Medical information (Información médica / Informação médica), in the About section; under the charts; in the footer of every PDF report.

---

## Wording

**Use:** "Keep a bladder diary"; "Log bathroom visits, drinks and leaks"; "Daily totals and simple charts of what you logged"; "Share your diary with your health professional"; "Your own daily targets".

**Do not use, in the app, the listing, screenshots, release notes or the website:** "insights", "analyse/analyze", "trends", "patterns", "personalised goals", "improve your (bladder) health", "healthy habits", "normal range", "medical guidelines", "clinically proven", "doctor-approved", "medical-grade", any named condition as a target group, or any claim to diagnose, treat, cure, prevent or monitor a condition.

---

## If Google asks for more information

1. **Intended purpose:** a personal bladder diary to keep a record and share it with a health professional.
2. **Users:** adults who keep a bladder diary, and carers or parents who keep one for someone else.
3. **Health claims:** none.
4. **Data:** stored on the device only; the app collects nothing (see `data-safety-answers.md`).
5. **Qualification:** the owner keeps an internal intended-purpose and MDR qualification note (see the compliance mapping, owner actions).

---

## Status

| Item                                          | Status | Notes |
| --------------------------------------------- | ------ | ----- |
| Health apps declaration: Health and fitness   | Open   | Submit with the first build that ships product decisions 1–9 |
| Store listing disclaimer (EN/ES/PT)           | Done in the metadata files | `metadata.{en,es,pt}.md` |
| In-app disclaimer in four places              | Check  | In the code under the charts, in Settings > Medical information and in the PDF footer; on the last onboarding page, with Skip leading to that page. Confirm all four on the release build |
| No misleading or interpretive health features | Open   | Product decisions 1–4 must ship first |
| Privacy policy URL live                       | Open   | https://diary.eleva.care/privacy |
| Data safety: No data collected / No data shared | Open | See `data-safety-answers.md` release blockers |

---

## References

- [Google Play, Health Content and Services policy](https://support.google.com/googleplay/android-developer/answer/16679511)
- [Google Play, Health app categories and additional information](https://support.google.com/googleplay/android-developer/answer/13996367)
- [MDCG 2019-11 Rev.1, Qualification and classification of software (June 2025)](https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en)
- [Regulation (EU) 2017/745 on medical devices](https://eur-lex.europa.eu/eli/reg/2017/745/oj)
