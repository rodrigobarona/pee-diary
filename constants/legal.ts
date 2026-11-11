/**
 * Legal pages and the version of the Terms of Use the app asks people to
 * accept. Change TERMS_VERSION whenever the published Terms of Use change.
 */

// Version (publication date) of the Terms of Use shown during onboarding.
// Stored on the device as termsAcceptedVersion when onboarding completes.
export const TERMS_VERSION = "2026-11-11";

export const LEGAL_URLS = {
  privacy: "https://diary.eleva.care/privacy",
  terms: "https://diary.eleva.care/terms",
  privacyChoices: "https://diary.eleva.care/privacy-choices",
} as const;
