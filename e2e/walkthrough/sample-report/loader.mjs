// Node resolve hook: lets the app's export module run outside React Native.
// "@/..." maps to the repo root (adding .ts), Expo native modules and the
// app's i18n entry are replaced by small stand-ins in stubs/.
import { statSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..", "..")
const stub = (name) => pathToFileURL(join(here, "stubs", `${name}.mjs`)).href
const STUBS = {
  "expo-file-system/legacy": stub("expo"),
  "expo-print": stub("expo"),
  "expo-sharing": stub("expo"),
  "@/lib/i18n": stub("i18n"),
  "expo-localization": stub("expo"),
}

function withExtension(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, join(path, "index.ts")]) {
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {}
  }
  return null
}

export async function resolve(specifier, context, next) {
  if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true }
  if (specifier.startsWith("@/")) {
    const file = withExtension(join(root, specifier.slice(2)))
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
    const base = join(dirname(fileURLToPath(context.parentURL)), specifier)
    const file = withExtension(base)
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  return next(specifier, context)
}
