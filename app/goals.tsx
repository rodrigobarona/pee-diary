import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';
import { useDiaryStore } from '@/lib/store';

export default function GoalsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const goals = useDiaryStore((state) => state.goals);
  const updateGoals = useDiaryStore((state) => state.updateGoals);

  const adjustFluidGoal = (delta: number) => {
    const newValue = Math.max(500, Math.min(5000, goals.fluidTarget + delta));
    if (newValue !== goals.fluidTarget) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      updateGoals({ fluidTarget: newValue });
    }
  };

  const adjustVoidGoal = (delta: number) => {
    const newValue = Math.max(3, Math.min(15, goals.voidTarget + delta));
    if (newValue !== goals.voidTarget) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      updateGoals({ voidTarget: newValue });
    }
  };

  const isFluidMin = goals.fluidTarget <= 500;
  const isFluidMax = goals.fluidTarget >= 5000;
  const isVoidMin = goals.voidTarget <= 3;
  const isVoidMax = goals.voidTarget >= 15;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustFluidGoal(-250)}
            disabled={isFluidMin}
            activeOpacity={0.7}
            style={[styles.stepperButtonSecondary, isFluidMin && styles.stepperButtonDisabled]}
          >
            <MaterialCommunityIcons name="minus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{goals.fluidTarget}</Text>
            <Text style={styles.unitText}>ml</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustFluidGoal(250)}
            disabled={isFluidMax}
            activeOpacity={0.7}
            style={[styles.stepperButtonSecondary, isFluidMax && styles.stepperButtonDisabled]}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
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
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustVoidGoal(-1)}
            disabled={isVoidMin}
            activeOpacity={0.7}
            style={[styles.stepperButtonPrimary, isVoidMin && styles.stepperButtonDisabled]}
          >
            <MaterialCommunityIcons name="minus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{goals.voidTarget}</Text>
            <Text style={styles.unitText}>{t('goals.perDay')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustVoidGoal(1)}
            disabled={isVoidMax}
            activeOpacity={0.7}
            style={[styles.stepperButtonPrimary, isVoidMax && styles.stepperButtonDisabled]}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Medical info */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>{t('goals.medicalInfo')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperButtonPrimary: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonSecondary: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.secondary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 40,
  },
  unitText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
    marginLeft: 10,
  },
});
