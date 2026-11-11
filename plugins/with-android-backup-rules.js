// Expo config plugin: Android Auto Backup rules for the diary.
//
// The diary may go to the user's Google account backup only when that backup
// is end-to-end encrypted with the phone's screen lock. Device-to-device
// transfers (phone to phone, cable or Wi-Fi) stay allowed.
//
// - Android 12+ (API 31+, app targets 31+): android:dataExtractionRules.
//   <cloud-backup disableIfNoEncryptionCapabilities="true"> turns cloud backup
//   off when it cannot be encrypted; <device-transfer> is omitted, so D2D
//   transfer keeps its default (all app data).
// - Android 9-11 (API 28-30): android:fullBackupContent, res/xml-v28. Each
//   domain is included only with requireFlags="clientSideEncryption" (cloud
//   backup encrypted with the screen lock) or "deviceToDeviceTransfer".
// - Android 7-8.1 (API 24-27): requireFlags does not exist and those backups
//   are never end-to-end encrypted, so res/xml excludes everything: no cloud
//   backup and no D2D transfer on these versions.
//
// Reference: https://developer.android.com/identity/data/autobackup
const fs = require("fs");
const path = require("path");
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");

const RULES_NAME = "eleva_backup_rules";
const EXTRACTION_RULES_NAME = "eleva_data_extraction_rules";

// Locations Auto Backup copies by default (cache and no_backup never are).
const DOMAINS = ["root", "file", "database", "sharedpref", "external"];

// Android 12 and higher.
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 12+: cloud backup only when it is end-to-end encrypted.
     No <device-transfer> section, so device-to-device transfer keeps all
     app data (except cache and no_backup). -->
<data-extraction-rules>
    <cloud-backup disableIfNoEncryptionCapabilities="true" />
</data-extraction-rules>
`;

// Android 9 to 11 (res/xml-v28).
const FULL_BACKUP_CONTENT_V28 = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 9-11: back up app data only to an end-to-end encrypted cloud
     backup or in a device-to-device transfer. -->
<full-backup-content>
${DOMAINS.map(
  (domain) =>
    `    <include domain="${domain}" path="." requireFlags="clientSideEncryption" />\n` +
    `    <include domain="${domain}" path="." requireFlags="deviceToDeviceTransfer" />`
).join("\n")}
</full-backup-content>
`;

// Android 7 to 8.1 (res/xml, used below API 28).
const FULL_BACKUP_CONTENT_LEGACY = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 7-8.1: backups cannot be end-to-end encrypted and requireFlags
     is not supported, so nothing is backed up or transferred. -->
<full-backup-content>
${[...DOMAINS, "device_root"]
  .map((domain) => `    <exclude domain="${domain}" path="." />`)
  .join("\n")}
</full-backup-content>
`;

function withBackupManifest(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );
    app.$["android:allowBackup"] = "true";
    app.$["android:fullBackupContent"] = `@xml/${RULES_NAME}`;
    app.$["android:dataExtractionRules"] = `@xml/${EXTRACTION_RULES_NAME}`;
    return config;
  });
}

function withBackupResources(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res"
      );
      const files = [
        ["xml", `${RULES_NAME}.xml`, FULL_BACKUP_CONTENT_LEGACY],
        ["xml-v28", `${RULES_NAME}.xml`, FULL_BACKUP_CONTENT_V28],
        ["xml", `${EXTRACTION_RULES_NAME}.xml`, DATA_EXTRACTION_RULES],
      ];
      for (const [folder, name, contents] of files) {
        const dir = path.join(resDir, folder);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(path.join(dir, name), contents);
      }
      return config;
    },
  ]);
}

module.exports = function withAndroidBackupRules(config) {
  return withBackupResources(withBackupManifest(config));
};
