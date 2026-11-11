/**
 * Legal pages and the version of the Terms of Use the app asks people to
 * accept. Change TERMS_VERSION whenever the published Terms of Use change.
 */

// Version (publication date) of the Terms of Use shown during onboarding.
// Stored on the device as termsAcceptedVersion when onboarding completes.
export const TERMS_VERSION = "2026-11-11";

// The legal website. Each page is served per language at
// {LEGAL_BASE_URL}/{en|es|pt}/{page}.
export const LEGAL_BASE_URL = "https://diary.eleva.care";

const LEGAL_PATHS = {
  privacy: "privacy",
  terms: "terms",
  privacyChoices: "privacy-choices",
} as const;

export type LegalPage = keyof typeof LEGAL_PATHS;

const LEGAL_LOCALES: readonly string[] = ["en", "es", "pt"];

/**
 * URL of a legal page in the app's language, for example
 * legalUrl("privacyChoices", "pt") is
 * https://diary.eleva.care/pt/privacy-choices. Falls back to English for a
 * language the website does not have.
 */
export function legalUrl(page: LegalPage, locale: string): string {
  const language = LEGAL_LOCALES.includes(locale) ? locale : "en";
  return `${LEGAL_BASE_URL}/${language}/${LEGAL_PATHS[page]}`;
}
