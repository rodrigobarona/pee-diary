// Expo config plugin: raise the size limit of AsyncStorage's database on
// Android.
//
// On Android, @react-native-async-storage/async-storage 2.x keeps all data in
// one SQLite database and caps it at 6 MB by default
// (android/config.gradle, getDatabaseSize()). The whole diary lives there, at
// roughly 250 bytes per entry (more with edit history), and a save briefly
// needs room for two copies (lib/store/chunked-storage.ts). At 15 entries a
// day (about 1.4 MB a year), 6 MB would fill up after about two years, and
// after that every save would fail. 50 MB leaves room for more than 15 years
// of heavy use. The cap only limits growth; it does not reserve space.
//
// The library reads the documented Gradle property AsyncStorage_db_size_in_MB
// from android/gradle.properties. (The 2 MB limit per stored value is a
// separate problem, solved by saving the diary in chunks.)
const { withGradleProperties } = require("expo/config-plugins");

const PROPERTY = "AsyncStorage_db_size_in_MB";
const DEFAULT_SIZE_MB = 50;

module.exports = function withAsyncStorageSize(config, props = {}) {
  const sizeMB = String(props.sizeMB ?? DEFAULT_SIZE_MB);
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === PROPERTY)
    );
    config.modResults.push({ type: "property", key: PROPERTY, value: sizeMB });
    return config;
  });
};
