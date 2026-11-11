import * as React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/shallow';

import { Icon, type IconName } from '@/components/ui/icon';
import { SheetHandle } from '@/components/ui/sheet-handle';
import { Text } from '@/components/ui/text';
import { adjustableA11y, hiddenA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n/context';
import { useDiaryStore } from '@/lib/store';
import { colors } from '@/lib/theme/colors';
import {
  cardStyle,
  iconSize,
  MIN_TOUCH_TARGET,
  radius,
  ripple,
  rippleBorderless,
  spacing,
} from '@/lib/theme/styles';
import { formatDate, formatTime } from '@/lib/utils/date';

const IS_IOS = Platform.OS === 'ios';
const STEP = 250;
const MIN_GOAL = 500;
const MAX_GOAL = 5000;

interface StepButtonProps {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}

// A round stepper button: teal glyph on the teal tint, 48pt/dp target
function StepButton({ icon, label, disabled, onPress }: StepButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={rippleBorderless(STEP_BUTTON_SIZE)}
      style={({ pressed }) => [
        styles.stepButton,
        disabled ? styles.stepButtonDisabled : undefined,
        IS_IOS && pressed ? styles.stepButtonPressedIOS : undefined,
      ]}
    >
      <Icon name={icon} size={iconSize.xl} color={colors.primary.DEFAULT} />
    </Pressable>
  );
}

export default function GoalsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const goals = useDiaryStore((state) => state.goals);
  const goalHistory = useDiaryStore(useShallow((state) => state.goalHistory));
  const updateGoals = useDiaryStore((state) => state.updateGoals);
  const [historyExpanded, setHistoryExpanded] = React.useState(false);

  const toggleHistory = () => {
    setHistoryExpanded(!historyExpanded);
  };

  // The goal is saved as it changes (the user's own target, no norm)
  const adjustFluidGoal = (delta: number) => {
    const newValue = Math.max(
      MIN_GOAL,
      Math.min(MAX_GOAL, goals.fluidTarget + delta)
    );
    if (newValue !== goals.fluidTarget) {
      haptics.selection();
      updateGoals({ fluidTarget: newValue });
    }
  };

  const isFluidMin = goals.fluidTarget <= MIN_GOAL;
  const isFluidMax = goals.fluidTarget >= MAX_GOAL;
  const valueText = t('a11y.settings.millilitres', { value: goals.fluidTarget });

  // Fluid target changes only, most recent first
  const sortedHistory = React.useMemo(() =>
    goalHistory.filter((record) => record.changes.fluidTarget).reverse(),
    [goalHistory]
  );

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={[
        styles.container,
        Platform.OS === 'android' ? styles.containerAndroid : undefined,
        { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <SheetHandle />
      {/* Title */}
      <Text
        variant={IS_IOS ? 'title3' : 'title2'}
        style={styles.title}
        accessibilityRole="header"
      >
        {t('goals.title')}
      </Text>
      <Text variant="subheadline" tone="secondary" style={styles.subtitle}>
        {t('goals.description')}
      </Text>

      {/* Fluid Goal Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.iconContainer}>
            <Icon
              name="cup-water"
              size={iconSize.lg}
              color={colors.category.fluid.accent}
            />
          </View>
          <View style={styles.labelContainer}>
            <Text variant="headline">{t('goals.fluidTarget')}</Text>
            <Text variant="footnote" tone="secondary" style={styles.goalDesc}>
              {t('goals.fluidDescription')}
            </Text>
          </View>
        </View>
        <View style={styles.stepperRow}>
          <StepButton
            icon="minus"
            label={t('a11y.settings.decreaseBy', { amount: STEP })}
            disabled={isFluidMin}
            onPress={() => adjustFluidGoal(-STEP)}
          />
          {/* One adjustable element: swipe up/down (VoiceOver) or the
              adjust actions (TalkBack) change the goal by 250 ml */}
          <View
            style={styles.valueContainer}
            {...adjustableA11y({
              label: t('goals.fluidDescription'),
              valueText,
              min: MIN_GOAL,
              max: MAX_GOAL,
              now: goals.fluidTarget,
              onIncrement: () => adjustFluidGoal(STEP),
              onDecrement: () => adjustFluidGoal(-STEP),
            })}
          >
            <Text variant="largeTitle" style={styles.valueText}>
              {goals.fluidTarget}
            </Text>
            <Text variant="subheadline" tone="secondary">
              ml
            </Text>
          </View>
          <StepButton
            icon="plus"
            label={t('a11y.settings.increaseBy', { amount: STEP })}
            disabled={isFluidMax}
            onPress={() => adjustFluidGoal(STEP)}
          />
        </View>
      </View>

      {/* About these targets */}
      <View style={styles.infoBox}>
        <Icon
          name="information-outline"
          size={iconSize.sm}
          color={colors.textSecondary}
          style={styles.infoIcon}
        />
        <Text variant="footnote" tone="secondary" style={styles.infoText}>
          {t('goals.targetsInfo')}
        </Text>
      </View>

      {/* Goal History Section */}
      <View style={styles.historySection}>
        <Pressable
          onPress={toggleHistory}
          style={({ pressed }) => [
            styles.historyHeader,
            IS_IOS && pressed ? styles.historyHeaderPressedIOS : undefined,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('goals.history')}
          accessibilityState={{ expanded: historyExpanded }}
          android_ripple={ripple}
        >
          <View style={styles.historyTitleRow}>
            <Icon name="history" size={iconSize.md} color={colors.textSecondary} />
            <Text variant="headline" tone="secondary">
              {t('goals.history')}
            </Text>
          </View>
          <Icon
            name={historyExpanded ? 'chevron-up' : 'chevron-down'}
            size={iconSize.md}
            color={colors.textSecondary}
          />
        </Pressable>

        {historyExpanded ? (
          <View style={styles.historyContent}>
            {sortedHistory.length === 0 ? (
              <Text
                variant="subheadline"
                tone="secondary"
                style={styles.historyEmpty}
              >
                {t('goals.historyEmpty')}
              </Text>
            ) : (
              sortedHistory.map((record, index) => {
                const change = record.changes.fluidTarget;
                const when = `${formatDate(record.changedAt, 'medium')}, ${formatTime(
                  record.changedAt
                )}`;
                return (
                  <View
                    key={record.changedAt}
                    style={[
                      styles.historyItem,
                      index < sortedHistory.length - 1
                        ? styles.historyItemBorder
                        : undefined,
                    ]}
                    accessible
                    accessibilityLabel={
                      change
                        ? t('a11y.settings.goalChange', {
                            date: when,
                            from: change.from,
                            to: change.to,
                          })
                        : when
                    }
                  >
                    <Text
                      variant="footnote"
                      tone="secondary"
                      style={styles.historyDate}
                    >
                      {when}
                    </Text>
                    {change ? (
                      <View style={styles.historyChange} {...hiddenA11y}>
                        <Icon
                          name="cup-water"
                          size={iconSize.sm}
                          color={colors.category.fluid.accent}
                        />
                        <Text variant="subheadline">
                          {t('goals.fluids')}: {change.from}ml → {change.to}ml
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const STEP_BUTTON_SIZE = Math.max(MIN_TOUCH_TARGET, 48);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  // The drag handle (SheetHandle) gives the top spacing on Android
  containerAndroid: {
    paddingTop: 0,
  },
  title: {
    textAlign: IS_IOS ? 'center' : 'left',
  },
  subtitle: {
    textAlign: IS_IOS ? 'center' : 'left',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  goalCard: {
    ...cardStyle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.category.fluid.container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  goalDesc: {
    marginTop: spacing.xxs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: STEP_BUTTON_SIZE / 2,
    backgroundColor: colors.primary.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.38,
  },
  stepButtonPressedIOS: {
    opacity: 0.55,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 112,
  },
  valueText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
  },
  // History section
  historySection: {
    marginTop: spacing.xl,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  historyHeaderPressedIOS: {
    backgroundColor: colors.highlight,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyContent: {
    ...cardStyle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  historyEmpty: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  historyItem: {
    paddingVertical: spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  historyDate: {
    marginBottom: spacing.sm,
  },
  historyChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
