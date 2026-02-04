import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { HapticTab } from '@/components/haptic-tab';
import { AddTabButton } from '@/components/add-tab-button';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

function SettingsHeaderButton() {
  const router = useRouter();

  const handlePress = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/settings');
  }, [router]);

  return (
    <Pressable onPress={handlePress} style={styles.headerButton}>
      <MaterialCommunityIcons name="cog-outline" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

function BackHeaderButton() {
  const router = useRouter();

  const handlePress = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <Pressable onPress={handlePress} style={styles.headerButtonLeft}>
      <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary.DEFAULT} />
    </Pressable>
  );
}

export default function TabLayout() {
  const { t, locale } = useI18n();

  return (
    <Tabs
      key={locale} // Force re-mount on locale change to update tab titles
      screenOptions={{
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 85,
          paddingBottom: 20,
        },
        tabBarButton: HapticTab,
        headerRight: () => <SettingsHeaderButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-today" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default navigation - the button handles the action
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size || 24} color={color} />
          ),
        }}
      />
      {/* Settings hidden from tab bar - accessed via header icon */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.settings'),
          headerRight: () => null, // No settings button on settings page
          headerLeft: () => <BackHeaderButton />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  headerButtonLeft: {
    marginLeft: 8,
    padding: 4,
  },
});
