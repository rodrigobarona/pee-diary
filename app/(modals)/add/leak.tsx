import * as React from "react";
import { Alert, StyleSheet, View } from "react-native";

import { TimePicker, UrgencyScale } from "@/components/diary";
import {
  LeakActivityPicker,
  LeakSeverityPicker,
} from "@/components/diary/leak-pickers";
import { FormCard, FormScrollView, SectionTitle } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type {
  LeakActivity,
  LeakSeverity,
  UrgencyLevel,
} from "@/lib/store/types";
import { spacing } from "@/lib/theme/styles";

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
    const saved = addLeakEntry({
      severity,
      urgency,
      activity,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (!saved) {
      Alert.alert(t("common.error"), t("error.saveRefused"));
      return false;
    }
    return true;
  }, [addLeakEntry, severity, urgency, activity, notes, timestamp, t]);

  useEntryFormHeader({
    title: t("leak.title"),
    saveLabel: t("common.save"),
    onSave: handleSave,
    isDirty,
  });

  return (
    <FormScrollView>
      {/* Time */}
      <TimePicker value={timestamp} onChange={setTimestamp} />

      {/* Severity */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.severity")}</SectionTitle>
        <LeakSeverityPicker
          value={severity}
          onChange={setSeverity}
          label={t("leak.severity")}
        />
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.urgency")}</SectionTitle>
        <UrgencyScale
          value={urgency}
          onChange={setUrgency}
          label={t("leak.urgency")}
        />
      </View>

      {/* Activity */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.activity")}</SectionTitle>
        <LeakActivityPicker
          value={activity}
          onChange={setActivity}
          label={t("leak.activity")}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <SectionTitle>{t("leak.notes")}</SectionTitle>
        <FormCard>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t("common.notesPlaceholder")}
            accessibilityLabel={t("leak.notes")}
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
  notesInput: {
    minHeight: 100,
  },
});
