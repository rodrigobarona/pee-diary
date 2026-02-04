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

import { AmountPicker, DrinkTypePicker, TimePicker } from "@/components/diary";
import { FormCard, ScreenHeader, SectionTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { DrinkType } from "@/lib/store/types";

// Offset to scroll input into view above keyboard
const SCROLL_OFFSET = 120;

export default function FluidScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addFluidEntry = useDiaryStore((state) => state.addFluidEntry);

  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [drinkType, setDrinkType] = React.useState<DrinkType>("water");
  const [amount, setAmount] = React.useState("250");
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
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    addFluidEntry({
      drinkType,
      amount: amountNum,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addFluidEntry, drinkType, amount, notes, timestamp, router]);

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
        <ScreenHeader title={t("fluid.title")} subtitle={t("fluid.subtitle")} />

        {/* Date & Time */}
        <TimePicker value={timestamp} onChange={setTimestamp} />

        {/* Drink Type Grid */}
        <View style={styles.section}>
          <SectionTitle>{t("fluid.drinkType")}</SectionTitle>
          <DrinkTypePicker value={drinkType} onChange={setDrinkType} />
        </View>

        {/* Amount Section */}
        <View style={styles.section}>
          <SectionTitle>{t("fluid.amount")}</SectionTitle>
          <AmountPicker
            value={amount}
            onChange={setAmount}
            drinkType={drinkType}
          />
        </View>

        {/* Notes */}
        <View
          style={styles.section}
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
          <SectionTitle>{t("fluid.notes")}</SectionTitle>
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
  notesInput: {
    minHeight: 100,
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
