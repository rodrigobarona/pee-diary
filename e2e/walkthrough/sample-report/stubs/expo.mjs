// Stand-ins for Expo native modules (never called when only building HTML)
export const cacheDirectory = null
export const documentDirectory = null
export const deleteAsync = async () => {}
export const moveAsync = async () => {}
export const readDirectoryAsync = async () => []
export const writeAsStringAsync = async () => {}
export const printToFileAsync = async () => ({ uri: "" })
export const shareAsync = async () => {}
export const getLocales = () => [{ languageCode: "en", regionCode: "PT" }]
export const getCalendars = () => [{ uses24hourClock: true, firstWeekday: 2 }]
