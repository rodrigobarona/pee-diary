# Eleva Diary — Google Play Health Apps Declaration

> **Last updated:** February 2026  
> **Reference:** [Google Play Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/10632613)

This document provides guidance for completing the Health apps declaration in Google Play Console for Eleva Diary.

---

## Overview

Google Play requires apps that provide health-related functionality to complete a Health apps declaration. This includes apps that:

- Track health or fitness data
- Provide health information
- Connect to medical devices

Eleva Diary falls under this policy as a **health tracking/logging app**.

---

## Health Apps Declaration Checklist

### 1. App Category Selection

In Play Console → App content → Health apps, select:

- [x] **Health or fitness tracking** — The app tracks user health data
- [ ] Medical device software — NOT applicable (no device connectivity)
- [ ] Telemedicine/telehealth — NOT applicable
- [ ] Health information — Informational only, NOT applicable
- [ ] Clinical trial recruitment — NOT applicable

---

### 2. Regulatory Status

#### "Is your app a medical device?"

**Answer:** ❌ No

Eleva Diary is a personal logging/diary tool. It does not:

- Diagnose medical conditions
- Provide treatment recommendations
- Control or connect to medical devices
- Perform clinical measurements

#### "Is your app regulated as a medical device in any jurisdiction?"

**Answer:** ❌ No

The app is a general wellness/logging tool not subject to medical device regulations (FDA, CE marking, etc.).

---

### 3. Medical Disclaimer Requirement

Google requires health apps to include a disclaimer. Eleva Diary includes this disclaimer:

#### In-App Disclaimer (Required)

Add to Settings → About or a dedicated Disclaimer screen:

**English:**

```
Medical Disclaimer

Eleva Diary is a personal logging tool designed to help you track bladder health patterns. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or health condition.

The information recorded and displayed in this app is for personal reference only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.

Always consult with a qualified healthcare provider before making any decisions about your health or if you have questions about a medical condition.
```

**Spanish:**

```
Aviso Médico

Eleva Diary es una herramienta de registro personal diseñada para ayudarte a controlar los patrones de salud de tu vejiga. No es un dispositivo médico y no está destinado a diagnosticar, tratar, curar o prevenir ninguna enfermedad o condición de salud.

La información registrada y mostrada en esta aplicación es solo para referencia personal y no debe usarse como sustituto del consejo médico profesional, diagnóstico o tratamiento.

Consulta siempre con un profesional de salud cualificado antes de tomar cualquier decisión sobre tu salud o si tienes preguntas sobre una condición médica.
```

**Portuguese:**

```
Aviso Médico

Eleva Diary é uma ferramenta de registro pessoal projetada para ajudar você a acompanhar os padrões de saúde da bexiga. Não é um dispositivo médico e não se destina a diagnosticar, tratar, curar ou prevenir qualquer doença ou condição de saúde.

As informações registradas e exibidas neste aplicativo são apenas para referência pessoal e não devem ser usadas como substituto de aconselhamento médico profissional, diagnóstico ou tratamento.

Consulte sempre um profissional de saúde qualificado antes de tomar qualquer decisão sobre sua saúde ou se tiver dúvidas sobre uma condição médica.
```

---

### 4. Store Listing Disclaimer

Include in the Full Description (already added in metadata files):

```
MEDICAL DISCLAIMER
Eleva Diary is a personal logging tool, not a medical device. It does not diagnose, treat, or prevent any condition. Always consult a qualified healthcare professional for medical advice.
```

---

### 5. Evidence/Documentation (If Requested)

Google may request documentation to verify your app's purpose. Prepare:

1. **App description**: Eleva Diary is a bladder diary for personal health logging
2. **Target users**: Individuals tracking bladder health, caregivers
3. **Clinical claims**: None — app makes no diagnostic or treatment claims
4. **Data handling**: All data stored locally; user controls export
5. **Professional guidance**: App encourages users to share data with healthcare providers

---

## Health App Policy Compliance Summary

| Requirement                 | Status       | Implementation                                |
| --------------------------- | ------------ | --------------------------------------------- |
| In-app medical disclaimer   | ✅ Required  | Add to Settings → About                       |
| Store listing disclaimer    | ✅ Required  | Included in Full Description                  |
| No misleading health claims | ✅ Compliant | Language focuses on "logging" not "diagnosis" |
| Clear purpose statement     | ✅ Compliant | "Personal bladder diary" language             |
| Privacy policy              | ✅ Required  | https://eleva.care/privacy                    |
| Data safety form            | ✅ Required  | See data-safety-answers.md                    |

---

## Prohibited Claims

Avoid these types of statements in the app or store listing:

❌ "Diagnose your bladder condition"
❌ "Cure incontinence"
❌ "Medical-grade tracking"
❌ "Doctor-approved treatment"
❌ "Clinically proven"
❌ "FDA approved" (unless actually approved)

### Acceptable Language

✅ "Track your bladder health patterns"
✅ "Log urination and fluid intake"
✅ "Share reports with your healthcare provider"
✅ "Personal diary tool"
✅ "Understand your body better"

---

## Implementation Checklist

Before submitting to Google Play:

- [ ] Complete Health apps declaration in Play Console
- [ ] Add medical disclaimer to Settings → About screen
- [ ] Verify store description includes medical disclaimer
- [ ] Ensure no misleading health claims in app or marketing
- [ ] Complete Data Safety form (see data-safety-answers.md)
- [ ] Privacy Policy URL is accessible and accurate
- [ ] Test that disclaimer is visible on first launch or easily accessible

---

## In-App Implementation Suggestion

Add to `app/(tabs)/settings.tsx`:

```tsx
// Legal section in Settings
<SectionTitle>Legal</SectionTitle>
<TouchableOpacity onPress={() => openURL('https://eleva.care/privacy')}>
  <OptionRow title="Privacy Policy" />
</TouchableOpacity>
<TouchableOpacity onPress={() => openURL('https://eleva.care/terms')}>
  <OptionRow title="Terms of Use" />
</TouchableOpacity>
<TouchableOpacity onPress={() => showDisclaimer()}>
  <OptionRow title="Medical Disclaimer" />
</TouchableOpacity>
```

---

## References

- [Google Play Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/10632613)
- [Sensitive Categories Policy](https://support.google.com/googleplay/android-developer/answer/10632508)
- [Medical Device Software Guidelines](https://support.google.com/googleplay/android-developer/answer/10632613#medical-device)
