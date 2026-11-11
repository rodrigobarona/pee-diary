import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { TimePicker, UrgencyScale, VolumePicker } from "@/components/diary";
import {
  AnimatedPressable,
  FormCard,
  FormScrollView,
  SectionTitle,
  ToggleRow,
} from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { UrgencyLevel, VolumeSize } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

const INITIAL_VOLUME: VolumeSize = "medium";
const INITIAL_URGENCY: UrgencyLevel = 3;

export default function UrinationScreen() {
  const { t } = useI18n();
  const addUrinationEntry = useDiaryStore((state) => state.addUrinationEntry);

  // Form state
  const [initialTimestamp] = React.useState(() => new Date());
  const [timestamp, setTimestamp] = React.useState(initialTimestamp);
  const [volume, setVolume] = React.useState<VolumeSize>(INITIAL_VOLUME);
  const [volumeMl, setVolumeMl] = React.useState<string>("");
  const [showPreciseVolume, setShowPreciseVolume] = React.useState(false);
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(INITIAL_URGENCY);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const isDirty =
    timestamp.getTime() !== initialTimestamp.getTime() ||
    volume !== INITIAL_VOLUME ||
    volumeMl !== "" ||
    urgency !== INITIAL_URGENCY ||
    hadLeak ||
    hadPain ||
    notes.trim() !== "";

  const handleSave = React.useCallback(() => {
    const parsedVolumeMl = volumeMl ? parseInt(volumeMl, 10) : undefined;
    addUrinationEntry({
      volume,
      volumeMl:
        parsedVolumeMl && !isNaN(parsedVolumeMl) ? parsedVolumeMl : undefined,
      urgency,
      hadLeak,
      hadPain,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return true;
  }, [
    addUrinationEntry,
    volume,
    volumeMl,
    urgency,
    hadLeak,
    hadPain,
    notes,
    timestamp,
  ]);

  useEntryFormHeader({
    title: t("urination.title"),
    saveLabel: t("common.save"),
    onSave: handleSave,
    isDirty,
  });

  const handleTogglePreciseVolume = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPreciseVolume((prev) => !prev);
    if (showPreciseVolume) {
      setVolumeMl(""); // Clear when hiding
    }
  }, [showPreciseVolume]);

  return (
    <FormScrollView>
      {/* Time */}
      <TimePicker value={timestamp} onChange={setTimestamp} />

      {/* Volume */}
      <View style={styles.section}>
        <SectionTitle>{t("urination.volume")}</SectionTitle>
        <VolumePicker value={volume} onChange={setVolume} />

        {/* Toggle for precise volume input */}
        <AnimatedPressable
          onPress={handleTogglePreciseVolume}
          haptic={false}
          style={styles.preciseVolumeToggle}
        >
          <MaterialCommunityIcons
            name={showPreciseVolume ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.primary.DEFAULT}
          />
          <Text style={styles.preciseVolumeToggleText}>
            {t("urination.volumePrecise")}
          </Text>
        </AnimatedPressable>

        {/* Precise volume input */}
        {showPreciseVolume ? (
          <FormCard>
            <Input
              value={volumeMl}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, "");
                setVolumeMl(numericValue);
              }}
              placeholder={t("urination.volumePrecisePlaceholder")}
              keyboardType="number-pad"
              className="bg-transparent border-0 px-4 py-3"
              returnKeyType="done"
            />
          </FormCard>
        ) : null}
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <SectionTitle>{t("urination.urgency")}</SectionTitle>
        <UrgencyScale value={urgency} onChange={setUrgency} />
      </View>

      {/* Additional Options */}
      <View style={styles.section}>
        <SectionTitle>{t("common.options")}</SectionTitle>
        <FormCard>
          <ToggleRow
            label={t("urination.hadLeak")}
            value={hadLeak}
            onValueChange={setHadLeak}
          />
          <View style={styles.separator} />
          <ToggleRow
            label={t("urination.hadPain")}
            value={hadPain}
            onValueChange={setHadPain}
          />
        </FormCard>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <SectionTitle>{t("urination.notes")}</SectionTitle>
        <FormCard>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t("common.notesPlaceholder")}
            multiline
            numberOfLines={3}
            className="bg-transparent border-0 px-4 py-3 h-auto"
            style={styles.notesInput}
            textAlignVertical="top"
            testID="form-notes"
          />
        </FormCard>
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  preciseVolumeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  preciseVolumeToggleText: {
    fontSize: 14,
    color: colors.primary.DEFAULT,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  notesInput: {
    minHeight: 100,
  },
});
