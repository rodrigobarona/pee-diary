import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { DateRangePicker } from "@/components/diary/date-range-picker";
import { Icon, type IconName } from "@/components/ui/icon";
import { OptionRow } from "@/components/ui/option-row";
import { SectionTitle } from "@/components/ui/section-title";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { a11yLabel, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import { dateFormatters } from "@/lib/i18n";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import {
  cardStyle,
  iconSize,
  radius,
  spacing,
} from "@/lib/theme/styles";
import {
  exportAndShare,
  filterEntriesByDateRange,
  getEarliestTimestamp,
  getDateRangePreset,
  type ExportFormat,
  type CSVLabels,
  type PDFTranslations,
} from "@/lib/utils/export";

type PresetKey =
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "allTime"
  | "custom";

const IS_IOS = Platform.OS === "ios";

export default function ExportScreen() {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const isHydrated = useStoreHydrated();
  const entries = useDiaryStore(useShallow((state) => state.entries));

  // State
  const [activePreset, setActivePreset] =
    React.useState<PresetKey>("last30days");
  const [startDate, setStartDate] = React.useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [selectedFormat, setSelectedFormat] =
    React.useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = React.useState(false);

  // Filter entries
  const filteredEntries = React.useMemo(() => {
    if (!isHydrated) return [];
    return filterEntriesByDateRange(entries, startDate, endDate);
  }, [entries, startDate, endDate, isHydrated]);

  // Get earliest entry date
  const minDate = React.useMemo(() => {
    if (entries.length === 0) return undefined;
    return new Date(getEarliestTimestamp(entries));
  }, [entries]);

  // Handle preset selection
  const handlePresetSelect = React.useCallback(
    (preset: PresetKey) => {
      // OptionRow plays the selection feedback
      setActivePreset(preset);

      if (preset !== "custom") {
        const range = getDateRangePreset(preset, entries);
        setStartDate(range.start);
        setEndDate(range.end);
      }
    },
    [entries],
  );

  // Handle format selection
  const handleFormatSelect = React.useCallback((fmt: ExportFormat) => {
    setSelectedFormat(fmt);
  }, []);

  // Build PDF translations from i18n
  const pdfTranslations: PDFTranslations = React.useMemo(
    () => ({
      title: t("pdf.title"),
      generatedBy: t("pdf.generatedBy"),
      generatedOn: t("pdf.generatedOn"),
      page: t("pdf.page"),
      of: t("pdf.of"),
      time: t("pdf.time"),
      fluidIntake: t("pdf.fluidIntake"),
      type: t("pdf.type"),
      ml: t("pdf.ml"),
      voidVolume: t("pdf.voidVolume"),
      urineLeaks: t("pdf.urineLeaks"),
      drops: t("pdf.drops"),
      moderate: t("pdf.moderate"),
      full: t("pdf.full"),
      urgency: t("pdf.urgency"),
      pain: t("pdf.pain"),
      notes: t("pdf.notes"),
      dailyTotal: t("pdf.dailyTotal"),
      voids: { one: t("pdf.voids.one"), other: t("pdf.voids.other") },
      leaks: { one: t("pdf.leaks.one"), other: t("pdf.leaks.other") },
      withPain: t("pdf.withPain"),
      disclaimer: t("disclaimer.text"),
      fluidTypes: {
        water: t("pdf.fluidTypes.water"),
        coffee: t("pdf.fluidTypes.coffee"),
        tea: t("pdf.fluidTypes.tea"),
        juice: t("pdf.fluidTypes.juice"),
        alcohol: t("pdf.fluidTypes.alcohol"),
        other: t("pdf.fluidTypes.other"),
      },
      volumes: {
        small: t("pdf.volumes.small"),
        medium: t("pdf.volumes.medium"),
        large: t("pdf.volumes.large"),
      },
    }),
    [t],
  );

  // CSV column names and values in the user's language
  const csvLabels: CSVLabels = React.useMemo(() => {
    const record = (prefix: string, codes: string[]) =>
      Object.fromEntries(codes.map((code) => [code, t(`${prefix}.${code}`)]));
    return {
      headers: [
        "id", "type", "timestamp", "date", "time", "volume", "volumeMl",
        "urgency", "hadLeak", "hadPain", "drinkType", "amountMl", "severity",
        "activity", "notes",
      ].map((key) => t(`csv.headers.${key}`)) as CSVLabels["headers"],
      yes: t("common.yes"),
      no: t("common.no"),
      values: {
        type: record("csv.types", ["urination", "fluid", "leak"]),
        volume: record("pdf.volumes", ["small", "medium", "large"]),
        drinkType: record("fluid", [
          "water", "coffee", "tea", "juice", "alcohol", "other",
        ]),
        severity: record("leak", ["drops", "moderate", "full"]),
        activity: record("leak.activities", [
          "coughing", "sneezing", "laughing", "exercise", "lifting",
          "standing", "walking", "sleeping", "other",
        ]),
      },
    };
  }, [t]);

  // Handle export
  const handleExport = React.useCallback(async () => {
    if (filteredEntries.length === 0) {
      Alert.alert(t("export.title"), t("export.noEntries"));
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportAndShare(
        filteredEntries,
        selectedFormat,
        { start: startDate, end: endDate },
        pdfTranslations,
        locale,
        csvLabels,
      );

      if (result.success) {
        haptics.success();
      } else if (result.error) {
        Alert.alert(
          t("common.error"),
          result.error === "noEntries"
            ? t("export.noEntries")
            : result.error === "fileUnavailable"
              ? t("export.fileUnavailable")
              : t("export.error")
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t("common.error"), t("export.error"));
    } finally {
      setIsExporting(false);
    }
  }, [filteredEntries, selectedFormat, startDate, endDate, t, pdfTranslations, locale, csvLabels]);

  // Preset options
  const presets: { key: PresetKey; label: string; icon: IconName }[] = [
    { key: "last7days", label: t("export.last7Days"), icon: "calendar-week" },
    {
      key: "last30days",
      label: t("export.last30Days"),
      icon: "calendar-month",
    },
    { key: "thisMonth", label: t("export.thisMonth"), icon: "calendar-today" },
    { key: "allTime", label: t("export.allTime"), icon: "calendar-star" },
    { key: "custom", label: t("export.customRange"), icon: "calendar-edit" },
  ];

  // Format options
  const formats: {
    key: ExportFormat;
    label: string;
    icon: IconName;
    color: string;
  }[] = [
    {
      key: "pdf",
      label: `${t("export.pdf")} · ${t("export.pdfDesc")}`,
      icon: "file-pdf-box",
      color: colors.orange.accent,
    },
    {
      key: "csv",
      label: `${t("export.csv")} · ${t("export.csvDesc")}`,
      icon: "file-delimited",
      color: colors.green.accent,
    },
    {
      key: "json",
      label: `${t("export.json")} · ${t("export.jsonDesc")}`,
      icon: "code-json",
      color: colors.violet.accent,
    },
  ];

  // Date range text
  // Formatted on every render: the screen re-renders when the language or
  // the device's date settings change (useI18n)
  const dateRangeText = `${dateFormatters.dayMonth.format(startDate)}\u2013${dateFormatters.dayMonthYear.format(endDate)}`;
  const entryCountText = isHydrated
    ? t("export.entryCount", { count: filteredEntries.length })
    : t("common.loading");
  const isExportDisabled = filteredEntries.length === 0 || isExporting;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          // Keeps Export & Share above the home indicator or the Android
          // gesture / 3-button navigation bar
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg,
          paddingTop: IS_IOS ? 48 : 0,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <SheetHandle />
      {/* Header */}
      <Text
        variant={IS_IOS ? "title3" : "title2"}
        style={styles.title}
        accessibilityRole="header"
      >
        {t("export.title")}
      </Text>
      <Text variant="subheadline" tone="secondary" style={styles.subtitle}>
        {t("settings.exportDescription")}
      </Text>

      {/* Date Range Section: one choice */}
      <SectionTitle>{t("export.dateRange")}</SectionTitle>
      <View style={styles.card} {...choiceGroupA11y(t("export.dateRange"))}>
        {presets.map((preset, index) => (
          <React.Fragment key={preset.key}>
            <OptionRow
              icon={preset.icon}
              label={preset.label}
              isSelected={activePreset === preset.key}
              onPress={() => handlePresetSelect(preset.key)}
            />
            {index < presets.length - 1 ? (
              <View style={styles.separator} />
            ) : null}
          </React.Fragment>
        ))}

        {/* Custom date range: shown when chosen; it grows with the font
            size instead of sitting in a fixed-height box */}
        {activePreset === "custom" ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.customRangePicker}
          >
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date);
                if (date > endDate) setEndDate(date);
              }}
              onEndDateChange={(date) => {
                setEndDate(date);
                if (date < startDate) setStartDate(date);
              }}
              minDate={minDate}
              maxDate={new Date()}
            />
          </Animated.View>
        ) : null}
      </View>

      {/* Selected Range */}
      <View
        style={styles.selectedRange}
        accessible
        accessibilityLabel={a11yLabel(dateRangeText, entryCountText)}
        accessibilityLiveRegion="polite"
      >
        <Icon
          name="calendar-range"
          size={iconSize.sm}
          color={colors.primary.DEFAULT}
        />
        <Text variant="subheadline" tone="accent" style={styles.selectedRangeText}>
          {dateRangeText}
        </Text>
        <Text variant="footnote" tone="secondary">
          {entryCountText}
        </Text>
      </View>

      {/* Format Section: one choice */}
      <SectionTitle>{t("export.format")}</SectionTitle>
      <View style={styles.card} {...choiceGroupA11y(t("export.format"))}>
        {formats.map((fmt, index) => (
          <React.Fragment key={fmt.key}>
            <OptionRow
              icon={fmt.icon}
              label={fmt.label}
              isSelected={selectedFormat === fmt.key}
              onPress={() => handleFormatSelect(fmt.key)}
              color={fmt.color}
            />
            {index < formats.length - 1 ? (
              <View style={styles.separator} />
            ) : null}
          </React.Fragment>
        ))}
      </View>

      {/* Export Button */}
      <Pressable
        style={({ pressed }) => [
          styles.exportButton,
          isExportDisabled ? styles.exportButtonDisabled : undefined,
          IS_IOS && pressed ? styles.exportButtonPressedIOS : undefined,
        ]}
        onPress={handleExport}
        disabled={isExportDisabled}
        accessibilityRole="button"
        accessibilityLabel={
          isExporting ? t("export.exporting") : t("export.exportAndShare")
        }
        accessibilityState={{
          disabled: isExportDisabled,
          busy: isExporting,
        }}
        android_ripple={{ color: "rgba(255, 255, 255, 0.24)", foreground: true }}
        testID="export-button"
      >
        {isExporting ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Icon name="share-variant" size={iconSize.md} color={colors.onPrimary} />
        )}
        <Text variant="button" tone="onAccent">
          {isExporting ? t("export.exporting") : t("export.exportAndShare")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    textAlign: IS_IOS ? "center" : "left",
  },
  subtitle: {
    textAlign: IS_IOS ? "center" : "left",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    ...cardStyle,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  // Inset to the start of the label (row padding + icon tile + gap)
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginStart: spacing.lg + 32 + spacing.md,
  },
  customRangePicker: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  selectedRange: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: spacing.sm,
    rowGap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.subtle,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  selectedRangeText: {
    fontWeight: "500",
  },
  // Filled button: iOS 12-point corners, Material 3 full radius
  exportButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: IS_IOS ? radius.md : radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
    minHeight: IS_IOS ? 50 : 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonPressedIOS: {
    opacity: 0.7,
  },
});
