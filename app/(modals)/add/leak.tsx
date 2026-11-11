import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { TimePicker, UrgencyScale } from "@/components/diary";
import {
  AnimatedPressable,
  FormCard,
  FormScrollView,
  SectionTitle,
} from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type {
  LeakActivity,
  LeakSeverity,
  UrgencyLevel,
} from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

const severityOptions: {
  value: LeakSeverity;
  icon: string;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "drops",
    icon: "water-outline",
    labelKey: "leak.drops",
    descriptionKey: "leak.dropsDesc",
  },
  {
    value: "moderate",
    icon: "water",
    labelKey: "leak.moderate",
    descriptionKey: "leak.moderateDesc",
  },
  {
    value: "full",
    icon: "water-alert",
    labelKey: "leak.full",
    descriptionKey: "leak.fullDesc",
  },
];

const activityOptions: {
  value: LeakActivity;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { value: "coughing", icon: "emoticon-sick-outline" },
  { value: "sneezing", icon: "emoticon-sick-outline" },
  { value: "laughing", icon: "emoticon-happy-outline" },
  { value: "exercise", icon: "run" },
  { value: "lifting", icon: "weight-lifter" },
  { value: "standing", icon: "human-handsup" },
  { value: "walking", icon: "walk" },
  { value: "sleeping", icon: "sleep" },
  { value: "other", icon: "dots-horizontal" },
];

const INITIAL_SEVERITY: LeakSeverity = "drops";
const INITIAL_URGENCY: UrgencyLevel = 3;

export default function LeakScreen() {
  const { t } = useI18n();
  const addLeakEntry = useDiaryStore((state) => state.addLeakEntry);

  const [initialTimestamp] = React.useState(() => new Date());
  const [timestamp, setTimestamp] = React.useState(initialTimestamp);
  const [severity, setSeverity] =
    React.useState<LeakSeverity>(INITIAL_SEVERITY);
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(INITIAL_URGENCY);
  const [activity, setActivity] = React.useState<LeakActivity | undefined>(
    undefined
  );
  const [notes, setNotes] = React.useState("");

  const isDirty =
    timestamp.getTime() !== initialTimestamp.getTime() ||
    severity !== INITIAL_SEVERITY ||
    urgency !== INITIAL_URGENCY ||
    activity !== undefined ||
    notes.trim() !== "";

  const handleSave = React.useCallback(() => {
    addLeakEntry({
      severity,
      urgency,
      activity,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return true;
  }, [addLeakEntry, severity, urgency, activity, notes, timestamp]);

  useEntryFormHeader({
    title: t("leak.title"),
    saveLabel: t("common.save"),
    onSave: handleSave,
    isDirty,
  });

  const handleSeveritySelect = React.useCallback((value: LeakSeverity) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSeverity(value);
  }, []);

  const handleActivitySelect = React.useCallback((value: LeakActivity) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Toggle off if already selected
    setActivity((prev) => (prev === value ? undefined : value));
  }, []);

  return (
    <FormScrollView>
      {/* Time */}
      <TimePicker value={timestamp} onChange={setTimestamp} />

      {/* Severity */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.severity")}</SectionTitle>
        <View style={styles.severityOptions}>
          {severityOptions.map((option) => {
            const isSelected = severity === option.value;
            return (
              <AnimatedPressable
                key={option.value}
                onPress={() => handleSeveritySelect(option.value)}
                haptic={false}
                style={[
                  styles.severityOption,
                  isSelected
                    ? styles.severityOptionSelected
                    : styles.severityOptionUnselected,
                ]}
              >
                <View
                  style={[
                    styles.severityIconContainer,
                    isSelected
                      ? styles.severityIconSelected
                      : styles.severityIconUnselected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={isSelected ? "#FFFFFF" : colors.error}
                  />
                </View>
                <View style={styles.severityTextContainer}>
                  <Text
                    style={[
                      styles.severityLabel,
                      isSelected ? styles.severityLabelSelected : undefined,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  <Text style={styles.severityDescription}>
                    {t(option.descriptionKey)}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.urgency")}</SectionTitle>
        <UrgencyScale value={urgency} onChange={setUrgency} />
      </View>

      {/* Activity */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.activity")}</SectionTitle>
        <View style={styles.activityGrid}>
          {activityOptions.map((option) => {
            const isSelected = activity === option.value;
            return (
              <AnimatedPressable
                key={option.value}
                onPress={() => handleActivitySelect(option.value)}
                haptic={false}
                style={[
                  styles.activityChip,
                  isSelected && styles.activityChipSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={18}
                  color={isSelected ? "#FFFFFF" : colors.primary.DEFAULT}
                />
                <Text
                  style={[
                    styles.activityChipText,
                    isSelected && styles.activityChipTextSelected,
                  ]}
                >
                  {t(`leak.activities.${option.value}`)}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.notes")}</SectionTitle>
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
  severityOptions: {
    gap: 12,
  },
  severityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  severityOptionSelected: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: colors.error,
  },
  severityOptionUnselected: {
    backgroundColor: "rgba(0, 109, 119, 0.08)",
  },
  severityIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderCurve: "continuous",
  },
  severityIconSelected: {
    backgroundColor: colors.error,
  },
  severityIconUnselected: {
    backgroundColor: "rgba(0, 109, 119, 0.15)",
  },
  severityTextContainer: {
    flex: 1,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  severityLabelSelected: {
    color: colors.error,
  },
  severityDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  notesInput: {
    minHeight: 100,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0, 109, 119, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activityChipSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary.DEFAULT,
  },
  activityChipTextSelected: {
    color: "#FFFFFF",
  },
});
