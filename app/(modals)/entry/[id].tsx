import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

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
  FormScrollView,
  SectionTitle,
  ToggleRow,
} from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type {
  DiaryEntry,
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

const TITLE_KEYS: Record<DiaryEntry["type"], string> = {
  urination: "detail.editUrination",
  fluid: "detail.editFluid",
  leak: "detail.editLeak",
};

// The editable values of an entry, with the form's defaults for the fields
// its type does not have
interface FormValues {
  timestamp: number;
  notes: string;
  volume: VolumeSize;
  urgency: UrgencyLevel;
  hadLeak: boolean;
  hadPain: boolean;
  drinkType: DrinkType;
  amount: string;
  severity: LeakSeverity;
}

function valuesFromEntry(entry: DiaryEntry): FormValues {
  return {
    timestamp: parseISO(entry.timestamp).getTime(),
    notes: entry.notes ?? "",
    volume: entry.type === "urination" ? entry.volume : "medium",
    urgency: entry.type === "fluid" ? 3 : entry.urgency,
    hadLeak: entry.type === "urination" ? entry.hadLeak : false,
    hadPain: entry.type === "urination" ? entry.hadPain : false,
    drinkType: entry.type === "fluid" ? entry.drinkType : "water",
    amount: entry.type === "fluid" ? entry.amount.toString() : "250",
    severity: entry.type === "leak" ? entry.severity : "drops",
  };
}

export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { t } = useI18n();

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

  // Values the form was loaded with, to tell whether anything changed
  const [loadedValues, setLoadedValues] = React.useState<FormValues | null>(
    null
  );
  const isLoaded = loadedValues !== null;

  // Load entry data when it becomes available
  React.useEffect(() => {
    if (entry && !isLoaded) {
      const values = valuesFromEntry(entry);
      setTimestamp(new Date(values.timestamp));
      setNotes(values.notes);
      setVolume(values.volume);
      setUrgency(values.urgency);
      setHadLeak(values.hadLeak);
      setHadPain(values.hadPain);
      setDrinkType(values.drinkType);
      setAmount(values.amount);
      setSeverity(values.severity);
      setLoadedValues(values);
    }
  }, [entry, isLoaded]);

  const currentValues: FormValues = {
    timestamp: timestamp.getTime(),
    notes,
    volume,
    urgency,
    hadLeak,
    hadPain,
    drinkType,
    amount,
    severity,
  };
  const isDirty =
    loadedValues !== null &&
    (Object.keys(currentValues) as (keyof FormValues)[]).some(
      (key) => currentValues[key] !== loadedValues[key]
    );

  const handleUpdate = () => {
    if (!entry) return false;

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

    updateEntry(entry.id, updates);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return true;
  };

  // The bin icon in the header; the legal documents describe deleting an
  // entry as "tap the bin icon and confirm with Delete".
  const handleDelete = (close: () => void) => {
    if (!entry) return;
    Alert.alert(t("common.delete"), t("detail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteEntry(entry.id);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          close();
        },
      },
    ]);
  };

  useEntryFormHeader({
    title: entry ? t(TITLE_KEYS[entry.type]) : t("detail.editEntry"),
    saveLabel: t("detail.update"),
    onSave: handleUpdate,
    isDirty,
    onDelete: handleDelete,
  });

  // Show loading if entry not yet loaded
  if (!entry || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006D77" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

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
        }`,
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
    <FormScrollView>
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
                        color={isSelected ? "#FFFFFF" : colors.error}
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
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
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
  severityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  severityLabelSelected: {
    color: colors.error,
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
    borderRadius: 16,
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
});
