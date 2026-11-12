// The app's date/number conventions without expo-localization: European
// formats and a 24-hour clock, as on a phone set to Portugal or Spain.
import { resolveIntlLocale, timeFormatOptions } from "../../../../lib/i18n/device-format.ts"

export const intlLocale = (locale) => resolveIntlLocale(locale, process.env.REGION ?? "PT")
export const deviceTimeFormatOptions = () => timeFormatOptions(true)
