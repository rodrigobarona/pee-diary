import en from "@/lib/i18n/locales/en.json";
import enAndroid from "@/lib/i18n/locales/en.android.json";

type Strings = { [key: string]: string | Strings };

const flatten = (strings: Strings, prefix = ""): Record<string, string> =>
  Object.entries(strings).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = `${prefix}${key}`;
    if (typeof value === "string") flat[path] = value;
    else Object.assign(flat, flatten(value, `${path}.`));
    return flat;
  }, {});

const base = flatten(en as Strings);
const overrides = flatten(enAndroid as Strings);

// UI names the legal documents quote in bold; both apps must show them as
// written there
const QUOTED_IN_LEGAL_DOCUMENTS = [
  "Clear All Data",
  "Export Backup File",
  "Import Backup File",
  "Export Data",
  "Export & Share",
  "Get Started",
  "Delete",
  "Local Backup",
  "Privacy Choices",
];

describe("Android sentence-case overrides (en.android.json)", () => {
  it("only overrides keys that exist in en.json", () => {
    for (const key of Object.keys(overrides)) {
      expect(base).toHaveProperty([key]);
    }
  });

  it("changes only the capitalisation", () => {
    for (const [key, value] of Object.entries(overrides)) {
      expect(value.toLowerCase()).toBe(base[key].toLowerCase());
    }
  });

  it("never overrides a name the legal documents quote", () => {
    for (const key of Object.keys(overrides)) {
      expect(QUOTED_IN_LEGAL_DOCUMENTS).not.toContain(base[key]);
    }
  });
});
