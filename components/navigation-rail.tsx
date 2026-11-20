import type { BottomTabBarProps } from 'expo-router/tabs';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import { iconSize, radius, spacing } from '@/lib/theme/styles';

// Material 3 navigation rail: 80dp wide, a 56dp FAB at the top, then the
// destinations (icon in a 56 x 32 indicator, label underneath)
export const NAVIGATION_RAIL_WIDTH = 80;
export const RAIL_SIDE: 'left' | 'right' = Platform.OS === 'ios' ? 'right' : 'left';
const FAB_SIZE = Platform.OS === 'ios' ? 50 : 56;
const LABEL_MAX_FONT_SCALE = 1.3;
const FAB_RIPPLE = { color: 'rgba(255, 255, 255, 0.24)', foreground: true };

/**
 * The tab bar on windows 600 wide or more (unfolded foldables, tablets): a
 * rail on the side. The "+" (Add Entry) is at its top, where the hand
 * holding the side of the device reaches it, with Today and History below.
 * On phones the bottom bar stays (see app/(tabs)/_layout.tsx).
 *
 * Android: on the leading edge (Material 3). iOS: on the trailing edge,
 * where iPhone Duo apps keep their controls, next to the inner screen's
 * status column (RAIL_SIDE).
 *
 * Screen readers hear one button and a list of two tabs, as with the bar.
 */
export function NavigationRail({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View
      style={[
        styles.rail,
        RAIL_SIDE === 'left' ? styles.railLeading : styles.railTrailing,
        {
          width:
            NAVIGATION_RAIL_WIDTH +
            (RAIL_SIDE === 'left' ? insets.left : insets.right),
          paddingStart: RAIL_SIDE === 'left' ? insets.left : 0,
          paddingEnd: RAIL_SIDE === 'right' ? insets.right : 0,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <AnimatedPressable
        onPress={() => router.push('/add-menu')}
        style={styles.fab}
        android_ripple={FAB_RIPPLE}
        accessibilityRole="button"
        accessibilityLabel={t('add.title')}
        testID="add-entry-button"
      >
        <Icon name="plus" size={iconSize.lg} color={colors.onPrimary} />
      </AnimatedPressable>

      <View style={styles.destinations} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? colors.primary.DEFAULT : colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              testID={options.tabBarButtonTestID}
            >
              {/* The tab's own icon: on Android it draws the Material
                  active indicator, on iOS the icon alone, tinted */}
              {options.tabBarIcon?.({ focused, color, size: iconSize.lg })}
              <Text
                variant="caption1"
                style={[styles.label, { color }]}
                numberOfLines={1}
                maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xxl,
  },
  railLeading: {
    borderEndWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderEndColor: 'rgba(0, 0, 0, 0.2)',
  },
  railTrailing: {
    borderStartWidth: StyleSheet.hairlineWidth,
    borderStartColor: 'rgba(0, 0, 0, 0.2)',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: Platform.OS === 'ios' ? FAB_SIZE / 2 : radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinations: {
    alignItems: 'center',
    gap: spacing.md,
  },
  item: {
    width: NAVIGATION_RAIL_WIDTH,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});
