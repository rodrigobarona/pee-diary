import en from "@/lib/i18n/locales/en.json";
import es from "@/lib/i18n/locales/es.json";
import pt from "@/lib/i18n/locales/pt.json";

type Messages = { [key: string]: string | Messages };

// Node's fs and path, typed locally (the project has no Node type definitions)
declare const __dirname: string;
const fs = jest.requireActual<{
  readdirSync(
    dir: string,
    options: { withFileTypes: true }
  ): { name: string; isDirectory(): boolean }[];
  readFileSync(file: string, encoding: "utf8"): string;
}>("fs");
const path = jest.requireActual<{
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
}>("path");

const flatten = (messages: Messages, prefix = ""): Record<string, string> =>
  Object.entries(messages).reduce<Record<string, string>>(
    (acc, [key, value]) =>
      typeof value === "string"
        ? { ...acc, [prefix + key]: value }
        : { ...acc, ...flatten(value, `${prefix}${key}.`) },
    {}
  );

const locales = { en, es, pt } as Record<string, Messages>;
const flat = Object.fromEntries(
  Object.entries(locales).map(([locale, messages]) => [
    locale,
    flatten(messages),
  ])
) as Record<"en" | "es" | "pt", Record<string, string>>;

describe("locale files", () => {
  it("have the same keys in English, Spanish and Portuguese", () => {
    const enKeys = Object.keys(flat.en).sort();
    expect(Object.keys(flat.es).sort()).toEqual(enKeys);
    expect(Object.keys(flat.pt).sort()).toEqual(enKeys);
  });

  it("have no empty strings", () => {
    for (const messages of Object.values(flat)) {
      for (const value of Object.values(messages)) {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it("carry the medical disclaimer word for word", () => {
    expect(flat.en["disclaimer.text"]).toBe(
      "Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms."
    );
    expect(flat.es["disclaimer.text"]).toBe(
      "Eleva Diary es un diario personal. No es un producto sanitario y no diagnostica, trata, cura ni previene ninguna afección. Consulta a un profesional de la salud sobre tus síntomas."
    );
    expect(flat.pt["disclaimer.text"]).toBe(
      "O Eleva Diary é um diário pessoal. Não é um dispositivo médico e não diagnostica, trata, cura nem previne qualquer doença. Fale com um profissional de saúde sobre os seus sintomas."
    );
  });

  // The legal documents quote these labels, so they must not drift.
  it.each([
    ["settings.title", "Settings", "Ajustes", "Definições"],
    ["settings.privacyPolicy", "Privacy Policy", "Política de privacidad", "Política de Privacidade"],
    ["settings.terms", "Terms of Use", "Términos de uso", "Termos de Utilização"],
    ["settings.privacyChoices", "Privacy Choices", "Opciones de privacidad", "Escolhas de Privacidade"],
    ["settings.privacyChoicesDescription", "How to delete your data", "Cómo eliminar tus datos", "Como eliminar os seus dados"],
    ["settings.medicalInfo", "Medical information", "Información médica", "Informação médica"],
    ["settings.clearData", "Clear All Data", "Borrar todos los datos", "Apagar todos os dados"],
    ["settings.export", "Export Data", "Exportar datos", "Exportar dados"],
    ["settings.localBackup", "Local Backup", "Copia local", "Cópia local"],
    ["settings.exportBackup", "Export Backup File", "Exportar copia de seguridad", "Exportar cópia de segurança"],
    ["settings.importBackup", "Import Backup File", "Importar copia de seguridad", "Importar cópia de segurança"],
    ["settings.reminders", "Reminders", "Recordatorios", "Lembretes"],
    ["tabs.history", "History", "Historial", "Histórico"],
    ["tabs.home", "Today", "Hoy", "Hoje"],
    ["common.delete", "Delete", "Eliminar", "Eliminar"],
  ])("label %s matches the legal documents", (key, enLabel, esLabel, ptLabel) => {
    expect(flat.en[key]).toBe(enLabel);
    expect(flat.es[key]).toBe(esLabel);
    expect(flat.pt[key]).toBe(ptLabel);
  });

  // No "have read" statement (DL 446/85 arts. 19(d) and 21(e))
  it("carry the onboarding acceptance line word for word", () => {
    expect(flat.en["onboarding.acceptance"]).toBe(
      "By continuing, you accept the {{terms}}. See how your data is handled in the {{privacy}}."
    );
    expect(flat.es["onboarding.acceptance"]).toBe(
      "Al continuar, aceptas los {{terms}}. Consulta cómo se tratan tus datos en la {{privacy}}."
    );
    expect(flat.pt["onboarding.acceptance"]).toBe(
      "Ao continuar, aceita os {{terms}}. Veja como os seus dados são tratados na {{privacy}}."
    );
  });

  it("have every translation key the app uses", () => {
    const root = path.resolve(__dirname, "../../..");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) files.push(full);
      }
    };
    ["app", "components", "lib", "hooks"].forEach((dir) =>
      walk(path.join(root, dir))
    );

    // t("a.b") calls and *Key: "a.b" fields (keys looked up later with t())
    const patterns = [
      /\bt\(\s*["'`]([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)["'`]/g,
      /\w*Key\??:\s*["']([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)["']/g,
    ];
    const used = new Set<string>();
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) used.add(match[1]);
      }
    }
    expect(used.size).toBeGreaterThan(100);

    const missing = [...used].filter(
      (key) =>
        !(key in flat.en) &&
        !(`${key}.one` in flat.en && `${key}.other` in flat.en)
    );
    expect(missing).toEqual([]);
  });

  it("use the placeholders the onboarding terms line expects", () => {
    for (const messages of Object.values(flat)) {
      expect(messages["onboarding.acceptance"]).toContain("{{terms}}");
      expect(messages["onboarding.acceptance"]).toContain("{{privacy}}");
    }
  });
});
