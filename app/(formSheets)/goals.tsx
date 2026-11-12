import * as React from 'react';
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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

// Where "Set a target" starts the stepper: the user's own average over the
// last 7 days with drinks (rounded to the step), or 1500 ml without any.
// It is a starting point to adjust, not a recommendation.
function startingTarget(): number {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byDay = new Map<string, number>();
  for (const entry of useDiaryStore.getState().entries) {
    if (entry.type !== 'fluid') continue;
    const time = new Date(entry.timestamp).getTime();
    if (time < since) continue;
    const day = entry.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + entry.amount);
  }
  if (byDay.size === 0) return 1500;
  const average = [...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size;
  return Math.max(MIN_GOAL, Math.min(MAX_GOAL, Math.round(average / STEP) * STEP));
}

export default function GoalsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const savedTarget = useDiaryStore((state) => state.goals.fluidTarget);
  const goalHistory = useDiaryStore(useShallow((state) => state.goalHistory));
  const updateGoals = useDiaryStore((state) => state.updateGoals);
  const [historyExpanded, setHistoryExpanded] = React.useState(false);

  // The target being edited. It is saved once, when the sheet closes, so the
  // goal history gets one record per visit instead of one per tap.
  const [target, setTarget] = React.useState<number | null>(savedTarget);
  const targetRef = React.useRef(target);
  React.useEffect(() => {
    targetRef.current = target;
  }, [target]);
  React.useEffect(() => {
    const commit = () => {
      const latest = targetRef.current;
      if (latest !== useDiaryStore.getState().goals.fluidTarget) {
        updateGoals({ fluidTarget: latest });
      }
    };
    // Also when the app goes to the background, in case it is closed there
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') commit();
    });
    return () => {
      subscription.remove();
      commit();
    };
  }, [updateGoals]);

  const toggleHistory = () => {
    setHistoryExpanded(!historyExpanded);
  };

  // The user's own target, no norm
  const adjustFluidGoal = (delta: number) => {
    if (target === null) return;
    const newValue = Math.max(MIN_GOAL, Math.min(MAX_GOAL, target + delta));
    if (newValue !== target) {
      haptics.selection();
      setTarget(newValue);
    }
  };

  const setOwnTarget = () => {
    haptics.selection();
    setTarget(startingTarget());
  };

  const removeTarget = () => {
    haptics.selection();
    setTarget(null);
  };

  const isFluidMin = target === null || target <= MIN_GOAL;
  const isFluidMax = target === null || target >= MAX_GOAL;
  const valueText = t('a11y.settings.millilitres', { value: target ?? 0 });
  const formatTarget = (value: number | null) =>
    value === null ? t('goals.noTarget') : `${value} ml`;

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
        {target === null ? (
          <View style={styles.noTarget}>
            <Text variant="subheadline" tone="secondary" style={styles.noTargetText}>
              {t('goals.noTargetDescription')}
            </Text>
            <Pressable
              onPress={setOwnTarget}
              accessibilityRole="button"
              android_ripple={ripple}
              style={({ pressed }) => [
                styles.textButton,
                IS_IOS && pressed ? styles.stepButtonPressedIOS : undefined,
              ]}
              testID="goals-set-target"
            >
              <Text variant="headline" tone="accent">
                {t('goals.setTarget')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                  now: target,
                  onIncrement: () => adjustFluidGoal(STEP),
                  onDecrement: () => adjustFluidGoal(-STEP),
                })}
              >
                <Text variant="largeTitle" style={styles.valueText}>
                  {target}
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
            <Pressable
              onPress={removeTarget}
              accessibilityRole="button"
              android_ripple={ripple}
              style={({ pressed }) => [
                styles.textButton,
                IS_IOS && pressed ? styles.stepButtonPressedIOS : undefined,
              ]}
            >
              <Text variant="subheadline" tone="secondary">
                {t('goals.removeTarget')}
              </Text>
            </Pressable>
          </>
        )}
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
                            from: formatTarget(change.from),
                            to: formatTarget(change.to),
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
                          {t('goals.fluids')}: {formatTarget(change.from)} →{' '}
                          {formatTarget(change.to)}
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
  noTarget: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  noTargetText: {
    textAlign: 'center',
  },
  textButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
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
