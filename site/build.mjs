// Builds the static legal website for https://diary.eleva.care from the
// Markdown in _docs/legal. Output: site/dist (served by Vercel, see vercel.json).
//
// Pages: /{pt,en,es}/ (product page) and /{pt,en,es}/{privacy,terms,privacy-choices}.
// Unprefixed paths redirect by browser language (vercel.json).
// No scripts, no cookies, no third-party assets.

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "site", "dist");
const SITE = "https://diary.eleva.care";
const LOCALES = ["pt", "en", "es"];
const PAGES = {
  privacy: "privacy-policy",
  terms: "terms",
  "privacy-choices": "privacy-choices",
};

const copy = {
  pt: {
    htmlLang: "pt-PT",
    languageName: "Português",
    home: "Início",
    privacy: "Política de Privacidade",
    terms: "Termos de Utilização",
    choices: "Escolhas de Privacidade",
    legal: "Informação legal",
    contacts: "Contactos",
    support: "Apoio",
    dataProtection: "Proteção de dados",
    legalNotices: "Comunicações legais e reclamações",
    complaintsBook: "Livro de Reclamações Eletrónico",
    company:
      "BÚZIOS E TARTARUGAS - LDA · NIPC 515001708 · Rua Gil Vicente 2, 2775-198 Parede, Portugal · Matriculada na Conservatória do Registo Comercial de Cascais · Capital social 200,00 €",
    noCookies: "Este site não usa cookies de análise nem de rastreio.",
    language: "Idioma",
    skip: "Saltar para o conteúdo",
    title: "Eleva Diary — o seu diário miccional",
    tagline: "O seu diário miccional pessoal",
    intro:
      "O Eleva Diary é um diário miccional pessoal e gratuito para iPhone e Android. Registe as idas à casa de banho, o que bebe e as perdas de urina em poucos toques, veja os totais diários e exporte o diário em PDF para o partilhar com o seu profissional de saúde.",
    points: [
      "O seu diário fica no seu telemóvel. Não precisa de conta e a aplicação não envia os seus dados para a Eleva.",
      "Lembretes opcionais, definidos e enviados pelo próprio telemóvel.",
      "Exporte em PDF, CSV ou JSON e guarde uma cópia de segurança quando quiser.",
    ],
    disclaimer:
      "O Eleva Diary é um diário pessoal. Não é um dispositivo médico e não diagnostica, trata, cura nem previne qualquer doença. Fale com um profissional de saúde sobre os seus sintomas.",
    notFound: "Página não encontrada",
    notFoundText: "Esta página não existe. Veja a Política de Privacidade, os Termos de Utilização ou as Escolhas de Privacidade.",
  },
  en: {
    htmlLang: "en",
    languageName: "English",
    home: "Home",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    choices: "Privacy Choices",
    legal: "Legal",
    contacts: "Contact",
    support: "Support",
    dataProtection: "Data protection",
    legalNotices: "Legal notices and complaints",
    complaintsBook: "Electronic Complaints Book (Livro de Reclamações)",
    company:
      "BÚZIOS E TARTARUGAS - LDA · NIPC 515001708 · Rua Gil Vicente 2, 2775-198 Parede, Portugal · Registered at the Cascais Commercial Registry · Share capital €200.00",
    noCookies: "This site uses no analytics or tracking cookies.",
    language: "Language",
    skip: "Skip to content",
    title: "Eleva Diary — your bladder diary",
    tagline: "Your personal bladder diary",
    intro:
      "Eleva Diary is a free, personal bladder diary for iPhone and Android. Log bathroom visits, drinks and leaks in a few taps, see daily totals, and export your diary as a PDF to share with your health professional.",
    points: [
      "Your diary stays on your phone. You need no account, and the app does not send your data to Eleva.",
      "Optional reminders, set and sent by your phone itself.",
      "Export as PDF, CSV or JSON and keep a backup file whenever you like.",
    ],
    disclaimer:
      "Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms.",
    notFound: "Page not found",
    notFoundText: "This page does not exist. See the Privacy Policy, the Terms of Use or Privacy Choices.",
  },
  es: {
    htmlLang: "es-ES",
    languageName: "Español",
    home: "Inicio",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    choices: "Opciones de privacidad",
    legal: "Información legal",
    contacts: "Contacto",
    support: "Soporte",
    dataProtection: "Protección de datos",
    legalNotices: "Comunicaciones legales y reclamaciones",
    complaintsBook: "Libro de Reclamaciones Electrónico (Livro de Reclamações)",
    company:
      "BÚZIOS E TARTARUGAS - LDA · NIPC 515001708 · Rua Gil Vicente 2, 2775-198 Parede, Portugal · Inscrita en el Registro Mercantil de Cascais · Capital social 200,00 €",
    noCookies: "Este sitio no usa cookies de análisis ni de seguimiento.",
    language: "Idioma",
    skip: "Saltar al contenido",
    title: "Eleva Diary — tu diario miccional",
    tagline: "Tu diario miccional personal",
    intro:
      "Eleva Diary es un diario miccional personal y gratuito para iPhone y Android. Registra tus idas al baño, lo que bebes y las pérdidas en pocos toques, consulta los totales diarios y exporta el diario en PDF para compartirlo con tu profesional de la salud.",
    points: [
      "Tu diario se queda en tu móvil. No necesitas cuenta y la aplicación no envía tus datos a Eleva.",
      "Recordatorios opcionales, programados y enviados por tu propio móvil.",
      "Exporta en PDF, CSV o JSON y guarda una copia de seguridad cuando quieras.",
    ],
    disclaimer:
      "Eleva Diary es un diario personal. No es un producto sanitario y no diagnostica, trata, cura ni previene ninguna afección. Consulta a un profesional de la salud sobre tus síntomas.",
    notFound: "Página no encontrada",
    notFoundText: "Esta página no existe. Consulta la Política de privacidad, los Términos de uso o las Opciones de privacidad.",
  },
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Markdown → HTML with heading anchors and same-language links to the site.
const renderMarkdown = (md, locale) => {
  const used = new Map();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        let id = slugify(text) || "section";
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
    },
  });
  // Links to the diary site stay in the reader's language.
  const localised = md.replace(
    /https:\/\/diary\.eleva\.care\/(privacy-choices|privacy|terms)\b/g,
    `/${locale}/$1`,
  );
  return marked.parse(localised);
};

const nav = (locale, current) => {
  const c = copy[locale];
  const links = [
    ["", c.home],
    ["privacy", c.privacy],
    ["terms", c.terms],
    ["privacy-choices", c.choices],
  ];
  return links
    .map(([path, label]) => {
      const href = `/${locale}${path ? `/${path}` : ""}`;
      const aria = path === current ? ' aria-current="page"' : "";
      return `<a href="${href}"${aria}>${escapeHtml(label)}</a>`;
    })
    .join("");
};

const languageLinks = (locale, path) =>
  LOCALES.map((l) => {
    const href = `/${l}${path ? `/${path}` : ""}`;
    const current = l === locale ? ' aria-current="true"' : "";
    return `<a href="${href}" hreflang="${copy[l].htmlLang}" lang="${copy[l].htmlLang}"${current}>${copy[l].languageName}</a>`;
  }).join("");

const alternates = (path) =>
  LOCALES.map(
    (l) =>
      `<link rel="alternate" hreflang="${copy[l].htmlLang}" href="${SITE}/${l}${path ? `/${path}` : ""}">`,
  ).join("\n    ") +
  `\n    <link rel="alternate" hreflang="x-default" href="${SITE}/${path || ""}">`;

const layout = ({ locale, path, title, description, body }) => {
  const c = copy[locale];
  return `<!doctype html>
<html lang="${c.htmlLang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${SITE}/${locale}${path ? `/${path}` : ""}">
    ${alternates(path)}
    <link rel="icon" href="/favicon.png" type="image/png">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <a class="skip" href="#main">${escapeHtml(c.skip)}</a>
    <header class="site-header">
      <div class="wrap header-row">
        <a class="brand" href="/${locale}"><img src="/icon.png" alt="" width="32" height="32"><span>Eleva Diary</span></a>
        <nav class="languages" aria-label="${escapeHtml(c.language)}">${languageLinks(locale, path)}</nav>
      </div>
      <nav class="wrap pages" aria-label="${escapeHtml(c.legal)}">${nav(locale, path)}</nav>
    </header>
    <main id="main" class="wrap">
${body}
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <p class="footer-links">
          <a href="/${locale}/privacy">${escapeHtml(c.privacy)}</a>
          <a href="/${locale}/terms">${escapeHtml(c.terms)}</a>
          <a href="/${locale}/privacy-choices">${escapeHtml(c.choices)}</a>
          <a href="https://www.livroreclamacoes.pt" rel="noopener">${escapeHtml(c.complaintsBook)}</a>
        </p>
        <p><strong>${escapeHtml(c.contacts)}:</strong>
          ${escapeHtml(c.support)} <a href="mailto:support@eleva.care">support@eleva.care</a> ·
          ${escapeHtml(c.dataProtection)} <a href="mailto:privacy@eleva.care">privacy@eleva.care</a> ·
          ${escapeHtml(c.legalNotices)} <a href="mailto:legal@eleva.care">legal@eleva.care</a>
        </p>
        <p>${escapeHtml(c.company)}</p>
        <p>${escapeHtml(c.noCookies)}</p>
      </div>
    </footer>
  </body>
</html>
`;
};

const write = (rel, html) => {
  const file = join(out, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(join(root, "site", "styles.css"), join(out, "styles.css"));
copyFileSync(join(root, "assets", "images", "icon.png"), join(out, "icon.png"));
copyFileSync(join(root, "assets", "images", "favicon.png"), join(out, "favicon.png"));

let pages = 0;
for (const locale of LOCALES) {
  const c = copy[locale];

  // Product page
  const home = `      <section class="hero">
        <h1>Eleva Diary</h1>
        <p class="tagline">${escapeHtml(c.tagline)}</p>
        <p>${escapeHtml(c.intro)}</p>
        <ul>${c.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
        <p class="disclaimer" role="note">${escapeHtml(c.disclaimer)}</p>
      </section>`;
  write(
    `${locale}/index.html`,
    layout({ locale, path: "", title: c.title, description: c.intro, body: home }),
  );
  pages++;

  // Legal pages
  for (const [path, file] of Object.entries(PAGES)) {
    const md = readFileSync(join(root, "_docs", "legal", `${file}.eleva-diary.${locale}.md`), "utf8");
    const title = (md.match(/^#\s+(.+)$/m)?.[1] ?? c[path]).trim();
    const body = `      <article class="legal">\n${renderMarkdown(md, locale)}\n      </article>`;
    write(
      `${locale}/${path}.html`,
      layout({ locale, path, title, description: `${title} — Eleva Diary`, body }),
    );
    pages++;
  }
}

// Fallback for anyone who reaches the bare domain without a redirect
write("index.html", layout({
  locale: "en",
  path: "",
  title: copy.en.title,
  description: copy.en.intro,
  body: `      <section class="hero">
        <h1>Eleva Diary</h1>
        <p class="language-choice">${LOCALES.map((l) => `<a href="/${l}" lang="${copy[l].htmlLang}">${copy[l].languageName}</a>`).join(" · ")}</p>
      </section>`,
}));
write("404.html", layout({
  locale: "en",
  path: "404",
  title: `${copy.en.notFound} — Eleva Diary`,
  description: copy.en.notFound,
  body: LOCALES.map((l) => `      <section lang="${copy[l].htmlLang}"><h1>${escapeHtml(copy[l].notFound)}</h1><p>${escapeHtml(copy[l].notFoundText)}</p><p><a href="/${l}/privacy">${escapeHtml(copy[l].privacy)}</a> · <a href="/${l}/terms">${escapeHtml(copy[l].terms)}</a> · <a href="/${l}/privacy-choices">${escapeHtml(copy[l].choices)}</a></p></section>`).join("\n"),
}));
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LOCALES.flatMap((l) => ["", ...Object.keys(PAGES)].map((p) => `  <url><loc>${SITE}/${l}${p ? `/${p}` : ""}</loc></url>`)).join("\n")}\n</urlset>\n`,
);

console.log(`Built ${pages} pages in ${out}`);
