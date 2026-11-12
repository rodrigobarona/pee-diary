// Build the app's own PDF export page (the HTML expo-print turns into a PDF)
// from the demo diary made by make-demo-backup.py, in one language. Print it
// with any Chromium, as run.sh-sample does:
//
//   node --import ./register.mjs make.mjs <backup.json> <en|pt|es> <out.html>
import { readFileSync, writeFileSync } from "node:fs"
import { generatePDFHTML } from "../../../lib/utils/export.ts"

const [backupPath, locale, outHtml] = process.argv.slice(2)
const backup = JSON.parse(readFileSync(backupPath, "utf8"))
const strings = JSON.parse(readFileSync(new URL(`../../../lib/i18n/locales/${locale}.json`, import.meta.url), "utf8"))
const pdf = strings.pdf

const translations = {
  ...Object.fromEntries(
    ["title", "generatedBy", "generatedOn", "page", "of", "time", "fluidIntake", "type", "ml",
     "voidVolume", "urineLeaks", "drops", "moderate", "full", "urgency", "pain", "notes",
     "dailyTotal", "withPain"].map((key) => [key, pdf[key]])
  ),
  voids: pdf.voids,
  leaks: pdf.leaks,
  disclaimer: strings.disclaimer.text,
  fluidTypes: pdf.fluidTypes,
  volumes: pdf.volumes,
}

// The last three full days, as a clinician usually asks for
const entries = backup.entries
const end = new Date()
end.setHours(0, 0, 0, 0)
end.setMilliseconds(-1)
const start = new Date(end)
start.setDate(start.getDate() - 2)
start.setHours(0, 0, 0, 0)
const inRange = entries.filter((e) => {
  const t = new Date(e.timestamp)
  return t >= start && t <= end
})

const html = generatePDFHTML(inRange, { start, end }, translations, locale)
writeFileSync(outHtml, html)
console.log(`${locale}: ${inRange.length} entries -> ${outHtml}`)
