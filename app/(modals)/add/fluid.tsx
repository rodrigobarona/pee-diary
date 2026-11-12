import * as React from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AmountPicker, DrinkTypePicker, TimePicker } from "@/components/diary";
import { FormCard, FormScrollView, SectionTitle } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useEntryFormHeader } from "@/hooks/use-entry-form-header";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { DrinkType } from "@/lib/store/types";
import { spacing } from "@/lib/theme/styles";

const INITIAL_DRINK: DrinkType = "water";
const INITIAL_AMOUNT = "250";

export default function FluidScreen() {
  const { t } = useI18n();
  const addFluidEntry = useDiaryStore((state) => state.addFluidEntry);

  const [initialTimestamp] = React.useState(() => new Date());
  const [timestamp, setTimestamp] = React.useState(initialTimestamp);
  const [drinkType, setDrinkType] = React.useState<DrinkType>(INITIAL_DRINK);
  const [amount, setAmount] = React.useState(INITIAL_AMOUNT);
  const [notes, setNotes] = React.useState("");

  const isDirty =
    timestamp.getTime() !== initialTimestamp.getTime() ||
    drinkType !== INITIAL_DRINK ||
    amount !== INITIAL_AMOUNT ||
    notes.trim() !== "";

  const handleSave = React.useCallback(() => {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t("fluid.amount"), t("fluid.amountRequired"));
      return false;
    }

    addFluidEntry({
      drinkType,
      amount: amountNum,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    return true;
  }, [addFluidEntry, drinkType, amount, notes, timestamp, t]);

  useEntryFormHeader({
    title: t("fluid.title"),
    saveLabel: t("common.save"),
    onSave: handleSave,
    isDirty,
  });

  return (
    <FormScrollView>
      {/* Date & Time */}
      <TimePicker value={timestamp} onChange={setTimestamp} />

      {/* Drink Type Grid */}
      <View style={styles.section}>
        <SectionTitle>{t("fluid.drinkType")}</SectionTitle>
        <DrinkTypePicker
          value={drinkType}
          onChange={setDrinkType}
          label={t("fluid.drinkType")}
        />
      </View>

      {/* Amount Section */}
      <View style={styles.section}>
        <SectionTitle>{t("fluid.amount")}</SectionTitle>
        <AmountPicker
          value={amount}
          onChange={setAmount}
          label={t("fluid.amount")}
          drinkType={drinkType}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <SectionTitle>{t("fluid.notes")}</SectionTitle>
        <FormCard>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t("common.notesPlaceholder")}
            accessibilityLabel={t("fluid.notes")}
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
