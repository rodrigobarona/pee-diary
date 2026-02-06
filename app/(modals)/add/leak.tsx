import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TimePicker, UrgencyScale } from "@/components/diary";
import {
  AnimatedPressable,
  FormCard,
  ScreenHeader,
  SectionTitle,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
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
  description: string;
}[] = [
  {
    value: "drops",
    icon: "water-outline",
    labelKey: "leak.drops",
    description: "A few drops",
  },
  {
    value: "moderate",
    icon: "water",
    labelKey: "leak.moderate",
    description: "Noticeable amount",
  },
  {
    value: "full",
    icon: "water-alert",
    labelKey: "leak.full",
    description: "Full accident",
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

// Offset to scroll input into view above keyboard
const SCROLL_OFFSET = 120;

export default function LeakScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addLeakEntry = useDiaryStore((state) => state.addLeakEntry);

  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [severity, setSeverity] = React.useState<LeakSeverity>("drops");
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [activity, setActivity] = React.useState<LeakActivity | undefined>(
    undefined
  );
  const [notes, setNotes] = React.useState("");

  // Scroll to notes when focused
  const handleNotesFocus = React.useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: notesLayoutY.current - SCROLL_OFFSET,
        animated: true,
      });
    }, 100);
  }, []);

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
    router.back();
  }, [addLeakEntry, severity, urgency, activity, notes, timestamp, router]);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "ios" ? 24 : 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={true}
        bounces={true}
      >
        {/* Header */}
        <ScreenHeader title={t("leak.title")} subtitle={t("leak.subtitle")} />

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
                      color={isSelected ? "#FFFFFF" : colors.primary.DEFAULT}
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
                      {option.description}
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
        <View
          style={styles.section}
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
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
              onFocus={handleNotesFocus}
            />
          </FormCard>
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      {Platform.OS === "ios" ? (
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <View
            style={[
              styles.footerContent,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Button onPress={handleSave} size="lg" style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            </Button>
          </View>
        </BlurView>
      ) : (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Button onPress={handleSave} size="lg" style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
          </Button>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 20,
  },
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
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
  },
  severityOptionSelected: {
    backgroundColor: colors.accent, // Design brief: Use accent instead of red
    borderWidth: 1,
    borderColor: colors.primary.light,
  },
  severityOptionUnselected: {
    backgroundColor: "rgba(0, 109, 119, 0.08)",
  },
  severityIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
  },
  severityIconSelected: {
    backgroundColor: colors.primary.light, // Design brief: Soft teal instead of red
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
    color: colors.primary.dark, // Design brief: Dark teal for selected text
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
    borderRadius: 8, // Design brief: 8px for chips
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
  footer: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerBlur: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  footerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveButton: {
    width: "100%",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 17,
  },
});
