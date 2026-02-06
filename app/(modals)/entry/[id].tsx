import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { parseISO } from "date-fns";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AmountPicker,
  DrinkTypePicker,
  TimePicker,
  UrgencyScale,
  VolumePicker,
} from "@/components/diary";
import {
  AnimatedPressable,
  FormCard,
  ScreenHeader,
  SectionTitle,
  ToggleRow,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type {
  DrinkType,
  LeakSeverity,
  UrgencyLevel,
  VolumeSize,
} from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

// Severity options for leak form
const severityOptions: {
  value: LeakSeverity;
  icon: string;
  labelKey: string;
}[] = [
  { value: "drops", icon: "water-outline", labelKey: "leak.drops" },
  { value: "moderate", icon: "water", labelKey: "leak.moderate" },
  { value: "full", icon: "water-alert", labelKey: "leak.full" },
];

export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get entry and actions from store
  const entries = useDiaryStore((state) => state.entries);
  const entry = id ? entries.find((e) => e.id === id) : undefined;
  const updateEntry = useDiaryStore((state) => state.updateEntry);
  const deleteEntry = useDiaryStore((state) => state.deleteEntry);

  // Form state - all with defaults (use lazy initializer)
  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [volume, setVolume] = React.useState<VolumeSize>("medium");
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
  const [drinkType, setDrinkType] = React.useState<DrinkType>("water");
  const [amount, setAmount] = React.useState("250");
  const [severity, setSeverity] = React.useState<LeakSeverity>("drops");
  const [notes, setNotes] = React.useState("");
  const [showEditHistory, setShowEditHistory] = React.useState(false);

  // Track if we've loaded the entry data
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load entry data when it becomes available
  React.useEffect(() => {
    if (entry && !isLoaded) {
      setTimestamp(parseISO(entry.timestamp));
      setNotes(entry.notes ?? "");

      if (entry.type === "urination") {
        setVolume(entry.volume);
        setUrgency(entry.urgency);
        setHadLeak(entry.hadLeak);
        setHadPain(entry.hadPain);
      } else if (entry.type === "fluid") {
        setDrinkType(entry.drinkType);
        setAmount(entry.amount.toString());
      } else if (entry.type === "leak") {
        setSeverity(entry.severity);
        setUrgency(entry.urgency);
      }

      setIsLoaded(true);
    }
  }, [entry, isLoaded]);

  // Scroll ref for keyboard
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  const handleNotesFocus = React.useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: notesLayoutY.current - 120,
        animated: true,
      });
    }, 100);
  }, []);

  // Show loading if entry not yet loaded
  if (!entry || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006D77" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const getTitle = () => {
    switch (entry.type) {
      case "urination":
        return t("detail.editUrination");
      case "fluid":
        return t("detail.editFluid");
      case "leak":
        return t("detail.editLeak");
    }
  };

  const handleUpdate = () => {
    const updates: Record<string, unknown> = {
      timestamp: timestamp.toISOString(),
      notes: notes.trim() || undefined,
    };

    if (entry.type === "urination") {
      updates.volume = volume;
      updates.urgency = urgency;
      updates.hadLeak = hadLeak;
      updates.hadPain = hadPain;
    } else if (entry.type === "fluid") {
      updates.drinkType = drinkType;
      updates.amount = parseInt(amount, 10);
    } else if (entry.type === "leak") {
      updates.severity = severity;
      updates.urgency = urgency;
    }

    updateEntry(id!, updates);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("detail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteEntry(id!);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          router.back();
        },
      },
    ]);
  };

  const handleSeveritySelect = (value: LeakSeverity) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSeverity(value);
  };

  const formatChangeValue = (key: string, value: unknown): string => {
    if (key === "timestamp" && typeof value === "string") {
      return dateFormatters.time.format(parseISO(value));
    }
    if (typeof value === "boolean") {
      return value ? t("common.yes") : t("common.no");
    }
    if (key === "volume") {
      return t(
        `urination.volume${
          (value as string).charAt(0).toUpperCase() + (value as string).slice(1)
        }`
      );
    }
    if (key === "urgency") {
      return t(`urgency.${value}`);
    }
    if (key === "drinkType") {
      return t(`fluid.${value}`);
    }
    if (key === "severity") {
      return t(`leak.${value}`);
    }
    if (key === "amount") {
      return `${value}ml`;
    }
    return String(value ?? "");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <ScreenHeader title={getTitle()} />
          <Pressable
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color="#EF4444"
            />
          </Pressable>
        </View>

        {/* Time */}
        <TimePicker value={timestamp} onChange={setTimestamp} />

        {/* Type-specific form */}
        {entry.type === "urination" ? (
          <>
            <View style={styles.section}>
              <SectionTitle>{t("urination.volume")}</SectionTitle>
              <VolumePicker value={volume} onChange={setVolume} />
            </View>

            <View style={styles.section}>
              <SectionTitle>{t("urination.urgency")}</SectionTitle>
              <UrgencyScale value={urgency} onChange={setUrgency} />
            </View>

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
          </>
        ) : null}

        {entry.type === "fluid" ? (
          <>
            <View style={styles.section}>
              <SectionTitle>{t("fluid.drinkType")}</SectionTitle>
              <DrinkTypePicker value={drinkType} onChange={setDrinkType} />
            </View>

            <View style={styles.section}>
              <SectionTitle>{t("fluid.amount")}</SectionTitle>
              <AmountPicker
                value={amount}
                onChange={setAmount}
                drinkType={drinkType}
                showInput={false}
              />
            </View>
          </>
        ) : null}

        {entry.type === "leak" ? (
          <>
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
                      <Text
                        style={[
                          styles.severityLabel,
                          isSelected ? styles.severityLabelSelected : undefined,
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle>{t("leak.urgency")}</SectionTitle>
              <UrgencyScale value={urgency} onChange={setUrgency} />
            </View>
          </>
        ) : null}

        {/* Notes */}
        <View
          style={styles.section}
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
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
              onFocus={handleNotesFocus}
            />
          </FormCard>
        </View>

        {/* Edit History */}
        {entry.editHistory && entry.editHistory.length > 0 ? (
          <View style={styles.section}>
            <Pressable
              onPress={() => setShowEditHistory(!showEditHistory)}
              style={styles.historyHeader}
            >
              <View style={styles.historyHeaderLeft}>
                <MaterialCommunityIcons
                  name="history"
                  size={20}
                  color={colors.primary.DEFAULT}
                />
                <Text style={styles.historyTitle}>
                  {t("detail.editHistory")} ({entry.editHistory.length})
                </Text>
              </View>
              <MaterialCommunityIcons
                name={showEditHistory ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9CA3AF"
              />
            </Pressable>

            {showEditHistory ? (
              <View style={styles.historyContent}>
                {entry.editHistory
                  .slice()
                  .reverse()
                  .map((edit, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Text style={styles.historyDate}>
                        {t("detail.edited")}:{" "}
                        {dateFormatters.long.format(parseISO(edit.editedAt))}{" "}
                        {dateFormatters.time.format(parseISO(edit.editedAt))}
                      </Text>
                      {Object.entries(edit.changes).map(([key, change]) => (
                        <Text key={key} style={styles.historyChangeText}>
                          <Text style={styles.historyChangeKey}>{key}</Text>:{" "}
                          {formatChangeValue(key, change.from)} →{" "}
                          {formatChangeValue(key, change.to)}
                        </Text>
                      ))}
                    </View>
                  ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Update Button */}
      {Platform.OS === "ios" ? (
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <View
            style={[
              styles.footerContent,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Button onPress={handleUpdate} size="lg" style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{t("detail.update")}</Text>
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
          <Button onPress={handleUpdate} size="lg" style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{t("detail.update")}</Text>
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
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 160,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  deleteButton: {
    padding: 8,
    marginTop: -8,
  },
  section: {
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
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
  severityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  severityLabelSelected: {
    color: colors.primary.dark, // Design brief: Dark teal for selected text
  },
  notesInput: {
    minHeight: 100,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
  },
  historyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  historyContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  historyDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  historyChangeText: {
    fontSize: 14,
    color: "#374151",
  },
  historyChangeKey: {
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#9CA3AF",
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
