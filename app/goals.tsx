import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';
import { useDiaryStore } from '@/lib/store';
import type { DailyGoals } from '@/lib/store/types';

export default function GoalsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const goals = useDiaryStore((state) => state.goals);
  const updateGoals = useDiaryStore((state) => state.updateGoals);
  const [editingGoals, setEditingGoals] = React.useState<DailyGoals>(goals);

  // Sync editing goals when store goals change
  React.useEffect(() => {
    setEditingGoals(goals);
  }, [goals]);

  const handleSaveGoals = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateGoals(editingGoals);
    router.back();
  }, [editingGoals, updateGoals, router]);

  const adjustFluidGoal = React.useCallback((delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingGoals((prev) => ({
      ...prev,
      fluidTarget: Math.max(500, Math.min(5000, prev.fluidTarget + delta)),
    }));
  }, []);

  const adjustVoidGoal = React.useCallback((delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingGoals((prev) => ({
      ...prev,
      voidTarget: Math.max(3, Math.min(15, prev.voidTarget + delta)),
    }));
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
      {/* Title */}
      <Text style={styles.title}>{t('goals.title')}</Text>
      <Text style={styles.subtitle}>{t('goals.description')}</Text>

      {/* Fluid Goal Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary.DEFAULT}15` }]}>
            <MaterialCommunityIcons name="cup-water" size={24} color={colors.secondary.DEFAULT} />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.goalLabel}>{t('goals.fluidTarget')}</Text>
            <Text style={styles.goalDesc}>{t('goals.fluidDescription')}</Text>
          </View>
        </View>
        <View style={styles.adjusterRow}>
          <Pressable
            onPress={() => adjustFluidGoal(-250)}
            style={({ pressed }) => [
              styles.adjusterButton,
              pressed && styles.adjusterButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="minus" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{editingGoals.fluidTarget}</Text>
            <Text style={styles.unitText}>ml</Text>
          </View>
          <Pressable
            onPress={() => adjustFluidGoal(250)}
            style={({ pressed }) => [
              styles.adjusterButton,
              pressed && styles.adjusterButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      {/* Void Goal Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary.DEFAULT}15` }]}>
            <MaterialCommunityIcons name="toilet" size={24} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.goalLabel}>{t('goals.voidTarget')}</Text>
            <Text style={styles.goalDesc}>{t('goals.voidDescription')}</Text>
          </View>
        </View>
        <View style={styles.adjusterRow}>
          <Pressable
            onPress={() => adjustVoidGoal(-1)}
            style={({ pressed }) => [
              styles.adjusterButton,
              pressed && styles.adjusterButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="minus" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{editingGoals.voidTarget}</Text>
            <Text style={styles.unitText}>{t('goals.perDay')}</Text>
          </View>
          <Pressable
            onPress={() => adjustVoidGoal(1)}
            style={({ pressed }) => [
              styles.adjusterButton,
              pressed && styles.adjusterButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      {/* Medical info */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information-outline" size={18} color="#6B7280" />
        <Text style={styles.infoText}>{t('goals.medicalInfo')}</Text>
      </View>

      {/* Save button */}
      <Pressable
        onPress={handleSaveGoals}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.saveButtonPressed,
        ]}
      >
        <Text style={styles.saveButtonText}>{t('common.save')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginLeft: 14,
    flex: 1,
  },
  goalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  goalDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  adjusterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adjusterButtonPressed: {
    backgroundColor: '#E5E7EB',
    transform: [{ scale: 0.95 }],
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  unitText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
