import { LEGAL_BASE_URL, legalUrl } from "@/constants/legal";

describe("legalUrl", () => {
  it.each([
    ["privacy", "en", "https://diary.eleva.care/en/privacy"],
    ["terms", "es", "https://diary.eleva.care/es/terms"],
    ["privacyChoices", "pt", "https://diary.eleva.care/pt/privacy-choices"],
  ] as const)("opens %s in %s", (page, locale, url) => {
    expect(legalUrl(page, locale)).toBe(url);
  });

  it("builds every page from the one base URL", () => {
    for (const page of ["privacy", "terms", "privacyChoices"] as const) {
      expect(legalUrl(page, "en").startsWith(`${LEGAL_BASE_URL}/en/`)).toBe(
        true
      );
    }
  });

  it("falls back to English for a language the website does not have", () => {
    expect(legalUrl("terms", "fr")).toBe("https://diary.eleva.care/en/terms");
  });
});
