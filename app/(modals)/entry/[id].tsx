import { parseISO } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from "react-native";

import {
  AmountPicker,
  DrinkTypePicker,
  TimePicker,
  UrgencyScale,
  VolumePicker,
} from "@/components/diary";
import { LeakSeverityPicker } from "@/components/diary/leak-pickers";
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
import { a11yLabel } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import type {
  DiaryEntry,
  DrinkType,
  LeakSeverity,
  UrgencyLevel,
  VolumeSize,
} from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  cardStyle,
  MIN_TOUCH_TARGET,
  spacing,
} from "@/lib/theme/styles";

// Names of the fields in the edit history
const FIELD_LABEL_KEYS: Record<string, string> = {
  timestamp: "time.when",
  volume: "urination.volume",
  volumeMl: "urination.volumePrecise",
  urgency: "urination.urgency",
  hadLeak: "urination.hadLeak",
  hadPain: "urination.hadPain",
  drinkType: "fluid.drinkType",
  amount: "fluid.amount",
  severity: "leak.severity",
  activity: "leak.activity",
  notes: "urination.notes",
};

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
  volumeMl: string;
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
    volumeMl:
      entry.type === "urination" && entry.volumeMl !== undefined
        ? entry.volumeMl.toString()
        : "",
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

  const entry = useDiaryStore((state) =>
    id ? state.entries.find((e) => e.id === id) : undefined
  );

  const isHydrated = useStoreHydrated();

  // The form starts from the entry's values once it is available (the store
  // may still be loading); a new entry id starts a new form. An id that is
  // not in the diary (deleted, or an old link) says so instead of loading
  // forever.
  if (!entry) return isHydrated ? <EntryNotFound /> : <EntryLoading />;
  return <EntryForm key={entry.id} entry={entry} />;
}

function EntryLoading() {
  const { t } = useI18n();

  useEntryFormHeader({
    title: t("detail.editEntry"),
    saveLabel: t("detail.update"),
    onSave: () => false,
    isDirty: false,
  });

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      <Text variant="body" tone="secondary">
        {t("common.loading")}
      </Text>
    </View>
  );
}

function EntryNotFound() {
  const { t } = useI18n();

  useEntryFormHeader({
    title: t("detail.editEntry"),
    saveLabel: t("detail.update"),
    onSave: () => false,
    isDirty: false,
  });

  return (
    <View style={styles.loadingContainer}>
      <Icon name="file-question-outline" size={48} color={colors.textSecondary} />
      <Text variant="body" tone="secondary" style={styles.notFoundText}>
        {t("detail.notFound")}
      </Text>
    </View>
  );
}

function EntryForm({ entry }: { entry: DiaryEntry }) {
  const { t } = useI18n();

  const updateEntry = useDiaryStore((state) => state.updateEntry);
  const deleteEntry = useDiaryStore((state) => state.deleteEntry);

  // Values the form was loaded with, to tell whether anything changed
  const [loadedValues] = React.useState<FormValues>(() =>
    valuesFromEntry(entry)
  );

  // Form state, starting from the entry
  const [timestamp, setTimestamp] = React.useState(
    () => new Date(loadedValues.timestamp)
  );
  const [volume, setVolume] = React.useState<VolumeSize>(loadedValues.volume);
  const [volumeMl, setVolumeMl] = React.useState(loadedValues.volumeMl);
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(
    loadedValues.urgency
  );
  const [hadLeak, setHadLeak] = React.useState(loadedValues.hadLeak);
  const [hadPain, setHadPain] = React.useState(loadedValues.hadPain);
  const [drinkType, setDrinkType] = React.useState<DrinkType>(
    loadedValues.drinkType
  );
  const [amount, setAmount] = React.useState(loadedValues.amount);
  const [severity, setSeverity] = React.useState<LeakSeverity>(
    loadedValues.severity
  );
  const [notes, setNotes] = React.useState(loadedValues.notes);
  const [showEditHistory, setShowEditHistory] = React.useState(false);

  const currentValues: FormValues = {
    timestamp: timestamp.getTime(),
    notes,
    volume,
    volumeMl,
    urgency,
    hadLeak,
    hadPain,
    drinkType,
    amount,
    severity,
  };
  const isDirty = (Object.keys(currentValues) as (keyof FormValues)[]).some(
    (key) => currentValues[key] !== loadedValues[key]
  );

  const handleUpdate = () => {
    const updates: Record<string, unknown> = {
      notes: notes.trim() || undefined,
    };
    // Only a time the user changed: rewriting an imported time with
    // milliseconds would add a change the user did not make
    if (timestamp.getTime() !== loadedValues.timestamp) {
      updates.timestamp = timestamp.toISOString();
    }

    if (entry.type === "urination") {
      const parsedVolumeMl = parseInt(volumeMl, 10);
      updates.volume = volume;
      // An empty field removes the exact amount
      updates.volumeMl = parsedVolumeMl > 0 ? parsedVolumeMl : undefined;
      updates.urgency = urgency;
      updates.hadLeak = hadLeak;
      updates.hadPain = hadPain;
    } else if (entry.type === "fluid") {
      const parsedAmount = parseInt(amount, 10);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert(t("fluid.amount"), t("fluid.amountRequired"));
        return false;
      }
      updates.drinkType = drinkType;
      updates.amount = parsedAmount;
    } else if (entry.type === "leak") {
      updates.severity = severity;
      updates.urgency = urgency;
    }

    if (!updateEntry(entry.id, updates)) {
      Alert.alert(t("common.error"), t("error.saveRefused"));
      return false;
    }
    return true;
  };

  // The bin icon (top app bar on Android, the button at the end of the form
  // on iOS); the legal documents describe deleting an entry as "tap the bin
  // icon and confirm with Delete".
  const handleDelete = (close: () => void) => {
    Alert.alert(t("common.delete"), t("detail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteEntry(entry.id);
          haptics.warning();
          close();
        },
      },
    ]);
  };

  const { deleteEntry: requestDelete } = useEntryFormHeader({
    title: t(TITLE_KEYS[entry.type]),
    saveLabel: t("detail.update"),
    onSave: handleUpdate,
    isDirty,
    onDelete: handleDelete,
  });

  const formatChangeValue = (key: string, value: unknown): string => {
    if (key === "timestamp" && typeof value === "string") {
      const date = parseISO(value);
      return `${dateFormatters.medium.format(date)} ${dateFormatters.time.format(date)}`;
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
    if (key === "activity" && typeof value === "string") {
      return t(`leak.activities.${value}`);
    }
    if ((key === "amount" || key === "volumeMl") && typeof value === "number") {
      return numberFormatters.ml.format(value);
    }
    return String(value ?? "");
  };

  const fieldLabel = (key: string) =>
    FIELD_LABEL_KEYS[key] ? t(FIELD_LABEL_KEYS[key]) : key;

  const editCount = entry.editHistory?.length ?? 0;

  return (
    <FormScrollView>
      {/* Time */}
      <TimePicker value={timestamp} onChange={setTimestamp} />

      {/* Type-specific form */}
      {entry.type === "urination" ? (
        <>
          <View style={styles.section}>
            <SectionTitle>{t("urination.volume")}</SectionTitle>
            <VolumePicker
              value={volume}
              onChange={setVolume}
              label={t("urination.volume")}
            />
            {/* The exact amount, if any: kept in step with the size */}
            <Text variant="footnote" tone="secondary" style={styles.fieldLabel}>
              {t("urination.exactAmount")}
            </Text>
            <FormCard>
              <View style={styles.unitRow}>
                <Input
                  value={volumeMl}
                  onChangeText={(text) => setVolumeMl(text.replace(/[^0-9]/g, ""))}
                  placeholder={t("urination.volumePrecisePlaceholder")}
                  accessibilityLabel={t("urination.exactAmount")}
                  keyboardType="number-pad"
                  appearance="plain"
                  returnKeyType="done"
                  style={styles.unitInput}
                />
                <Text variant="body" tone="secondary" style={styles.unit}>
                  ml
                </Text>
              </View>
            </FormCard>
          </View>

          <View style={styles.section}>
            <SectionTitle>{t("urination.urgency")}</SectionTitle>
            <UrgencyScale
              value={urgency}
              onChange={setUrgency}
              label={t("urination.urgency")}
            />
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
            <DrinkTypePicker
              value={drinkType}
              onChange={setDrinkType}
              label={t("fluid.drinkType")}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle>{t("fluid.amount")}</SectionTitle>
            <AmountPicker
              value={amount}
              onChange={setAmount}
              label={t("fluid.amount")}
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
            <LeakSeverityPicker
              value={severity}
              onChange={setSeverity}
              label={t("leak.severity")}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle>{t("leak.urgency")}</SectionTitle>
            <UrgencyScale
              value={urgency}
              onChange={setUrgency}
              label={t("leak.urgency")}
            />
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

      {/* Edit History */}
      {editCount > 0 ? (
        <View style={styles.section}>
          <AnimatedPressable
            onPress={() => setShowEditHistory(!showEditHistory)}
            feedback="highlight"
            highlightColor={colors.highlight}
            accessibilityRole="button"
            accessibilityLabel={a11yLabel(t("detail.editHistory"), editCount)}
            accessibilityState={{ expanded: showEditHistory }}
            style={styles.historyHeader}
          >
            <View style={styles.historyHeaderLeft}>
              <Icon name="history" size={20} color={colors.primary.DEFAULT} />
              <Text variant="body" style={styles.historyTitle}>
                {t("detail.editHistory")} ({editCount})
              </Text>
            </View>
            <Icon
              name={showEditHistory ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.outline}
            />
          </AnimatedPressable>

          {showEditHistory ? (
            <View style={styles.historyContent}>
              {(entry.editHistory ?? [])
                .slice()
                .reverse()
                .map((edit, index) => {
                  const editedAt = parseISO(edit.editedAt);
                  return (
                    <View key={index} style={styles.historyItem}>
                      <Text
                        variant="footnote"
                        tone="secondary"
                        style={styles.historyDate}
                      >
                        {t("detail.edited")}:{" "}
                        {dateFormatters.long.format(editedAt)}{" "}
                        {dateFormatters.time.format(editedAt)}
                      </Text>
                      {Object.entries(edit.changes).map(([key, change]) => {
                        const from = formatChangeValue(key, change.from);
                        const to = formatChangeValue(key, change.to);
                        return (
                          <Text
                            key={key}
                            variant="subheadline"
                            accessibilityLabel={`${fieldLabel(key)}: ${t(
                              "detail.changedFrom"
                            )} ${from} ${t("detail.changedTo")} ${to}`}
                          >
                            <Text variant="subheadline" style={styles.historyChangeKey}>
                              {fieldLabel(key)}
                            </Text>
                            : {from} → {to}
                          </Text>
                        );
                      })}
                    </View>
                  );
                })}
            </View>
          ) : null}
        </View>
      ) : null}
      {/* iOS: delete at the end of the form, in red with the bin icon */}
      {Platform.OS === "ios" && requestDelete ? (
        <AnimatedPressable
          onPress={requestDelete}
          feedback="highlight"
          highlightColor={colors.highlight}
          accessibilityRole="button"
          accessibilityLabel={t("detail.deleteEntry")}
          style={styles.deleteButton}
          testID="form-delete"
        >
          <Icon name="trash-can-outline" size={20} color={colors.destructive} />
          <Text variant="body" style={styles.deleteText}>
            {t("detail.deleteEntry")}
          </Text>
        </AnimatedPressable>
      ) : null}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginStart: spacing.lg,
  },
  notesInput: {
    minHeight: 100,
  },
  historyHeader: {
    ...cardStyle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  historyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  historyTitle: {
    fontWeight: "500",
  },
  historyContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  historyItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  historyDate: {
    marginBottom: spacing.sm,
  },
  historyChangeKey: {
    fontWeight: "500",
  },
  deleteButton: {
    ...cardStyle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.md,
    overflow: "hidden",
  },
  deleteText: {
    color: colors.destructive,
  },
  fieldLabel: {
    marginTop: spacing.xs,
    marginStart: spacing.xs,
  },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitInput: {
    flex: 1,
  },
  unit: {
    paddingEnd: spacing.lg,
  },
  notFoundText: {
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
});
