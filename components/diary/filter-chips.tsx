import * as React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel, tabA11y, tabListA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { numberFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import {
  MIN_TOUCH_TARGET,
  iconSize,
  radius,
  spacing,
} from "@/lib/theme/styles";

export type FilterType = "all" | "urination" | "fluid" | "leak";

interface FilterChipsProps {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  counts?: {
    all: number;
    urination: number;
    fluid: number;
    leak: number;
  };
}

interface ChipConfig {
  id: FilterType;
  labelKey: string;
  icon: IconName;
  // Identity colour of the category, for the icon of an unselected chip
  color: string;
}

const chips: ChipConfig[] = [
  {
    id: "all",
    labelKey: "history.all",
    icon: "format-list-bulleted",
    color: colors.textSecondary,
  },
  {
    id: "urination",
    labelKey: "entry.urination",
    icon: "toilet",
    color: colors.category.urination.accent,
  },
  {
    id: "fluid",
    labelKey: "entry.fluid",
    icon: "cup-water",
    color: colors.category.fluid.accent,
  },
  {
    id: "leak",
    labelKey: "entry.leak",
    icon: "water-alert",
    color: colors.category.leak.accent,
  },
];

// Material 3 filter chip: 32 high, inside a row that gives each chip the
// platform's minimum touch target
const CHIP_HEIGHT = 32;
const CHIP_HIT_SLOP = Math.ceil((MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2);

const FADE_FROM = colors.background;
const FADE_TO = `${colors.background}00`;

/**
 * Entry type filters for History: a tab list of chips. One neutral selected
 * style for every category (teal container with a check mark); the category
 * colour only marks the icon of an unselected chip.
 */
export function FilterChips({ selected, onSelect, counts }: FilterChipsProps) {
  const { t } = useI18n();
  const [showRightFade, setShowRightFade] = React.useState(true);
  const [showLeftFade, setShowLeftFade] = React.useState(false);

  const handleSelect = React.useCallback(
    (filter: FilterType) => {
      if (filter !== selected) {
        haptics.selection();
      }
      onSelect(filter);
    },
    [onSelect, selected],
  );

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const isAtStart = contentOffset.x <= 5;
      const isAtEnd =
        contentOffset.x + layoutMeasurement.width >= contentSize.width - 5;

      setShowLeftFade(!isAtStart);
      setShowRightFade(!isAtEnd);
    },
    [],
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        {...tabListA11y}
      >
        {chips.map((chip) => {
          const isSelected = selected === chip.id;
          const count = counts?.[chip.id];
          const label = t(chip.labelKey);
          const textColor = isSelected
            ? colors.primary.onContainer
            : colors.text;

          return (
            <AnimatedPressable
              key={chip.id}
              onPress={() => handleSelect(chip.id)}
              hitSlop={{ top: CHIP_HIT_SLOP, bottom: CHIP_HIT_SLOP }}
              style={[styles.chip, isSelected ? styles.chipSelected : null]}
              {...tabA11y(isSelected)}
              accessibilityLabel={a11yLabel(
                label,
                count !== undefined
                  ? t("a11y.history.entryCount", { count })
                  : null,
              )}
              testID={`filter-${chip.id}`}
            >
              <Icon
                name={isSelected ? "check" : chip.icon}
                size={iconSize.sm}
                color={isSelected ? colors.primary.onContainer : chip.color}
              />
              <Text
                variant="subheadline"
                style={[styles.chipText, { color: textColor }]}
              >
                {label}
              </Text>
              {count !== undefined && count > 0 ? (
                <Text
                  variant="subheadline"
                  style={[
                    styles.countText,
                    {
                      color: isSelected
                        ? colors.primary.onContainer
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {numberFormatters.decimal.format(count)}
                </Text>
              ) : null}
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* Fades at the edges show that the row scrolls */}
      {showLeftFade ? (
        <LinearGradient
          colors={[FADE_FROM, FADE_TO]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeLeft}
          pointerEvents="none"
        />
      ) : null}

      {showRightFade ? (
        <LinearGradient
          colors={[FADE_TO, FADE_FROM]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeRight}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    // Room for each chip's full touch target above and below it
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: Platform.OS === "ios" ? spacing.xs : 0,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  chipSelected: {
    backgroundColor: colors.primary.container,
    borderColor: colors.primary.container,
  },
  chipText: {
    fontWeight: "500",
  },
  countText: {
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: spacing.xl,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: spacing.xl,
  },
});
