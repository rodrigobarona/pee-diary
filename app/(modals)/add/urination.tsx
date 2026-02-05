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

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { TimePicker, UrgencyScale, VolumePicker } from "@/components/diary";
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
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { UrgencyLevel, VolumeSize } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

// Offset to scroll input into view above keyboard
const SCROLL_OFFSET = 120;

export default function UrinationScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addUrinationEntry = useDiaryStore((state) => state.addUrinationEntry);

  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  // Form state
  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [volume, setVolume] = React.useState<VolumeSize>("medium");
  const [volumeMl, setVolumeMl] = React.useState<string>("");
  const [showPreciseVolume, setShowPreciseVolume] = React.useState(false);
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
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
    router.back();
  }, [
    addUrinationEntry,
    volume,
    volumeMl,
    urgency,
    hadLeak,
    hadPain,
    notes,
    timestamp,
    router,
  ]);

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
        <ScreenHeader
          title={t("urination.title")}
          subtitle={t("urination.subtitle")}
        />

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
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 20,
  },
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
