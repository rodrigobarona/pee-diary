import * as React from "react";
import { Alert, StyleSheet, View } from "react-native";

import { TimePicker, UrgencyScale, VolumePicker } from "@/components/diary";
import {
  AnimatedPressable,
  FormCard,
  FormScrollView,
  SectionTitle,
  ToggleRow,
} from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { UrgencyLevel, VolumeSize } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import { MIN_TOUCH_TARGET, radius, spacing } from "@/lib/theme/styles";

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
    const saved = addUrinationEntry({
      volume,
      volumeMl:
        parsedVolumeMl && !isNaN(parsedVolumeMl) ? parsedVolumeMl : undefined,
      urgency,
      hadLeak,
      hadPain,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (!saved) {
      Alert.alert(t("common.error"), t("error.saveRefused"));
      return false;
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
    t,
  ]);

  useEntryFormHeader({
    title: t("urination.title"),
    saveLabel: t("common.save"),
    onSave: handleSave,
    isDirty,
  });

  const handleTogglePreciseVolume = React.useCallback(() => {
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
        <VolumePicker
          value={volume}
          onChange={setVolume}
          label={t("urination.volume")}
        />

        {/* Toggle for precise volume input */}
        <AnimatedPressable
          onPress={handleTogglePreciseVolume}
          style={styles.preciseVolumeToggle}
          accessibilityRole="button"
          accessibilityLabel={t("urination.volumePrecise")}
          accessibilityState={{ expanded: showPreciseVolume }}
        >
          <Icon
            name={showPreciseVolume ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.primary.DEFAULT}
          />
          <Text variant="subheadline" tone="accent" style={styles.linkText}>
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
              accessibilityLabel={t("urination.volumePrecise")}
              keyboardType="number-pad"
              appearance="plain"
              returnKeyType="done"
            />
          </FormCard>
        ) : null}
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <SectionTitle>{t("urination.urgency")}</SectionTitle>
        <UrgencyScale
          value={urgency}
          onChange={setUrgency}
          label={t("urination.urgency")}
        />
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
            accessibilityLabel={t("urination.notes")}
            multiline
            numberOfLines={3}
            appearance="plain"
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
    gap: spacing.sm,
  },
  preciseVolumeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  linkText: {
    fontWeight: "500",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginStart: spacing.lg,
  },
  notesInput: {
    minHeight: 100,
  },
});
