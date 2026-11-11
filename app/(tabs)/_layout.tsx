import { BlurView } from 'expo-blur';
import { BottomTabBar, type BottomTabBarProps, Tabs } from 'expo-router/tabs';
import React from 'react';
import {
  type ColorValue,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTabButton } from '@/components/add-tab-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import { iconSize } from '@/lib/theme/styles';
import { typography } from '@/lib/theme/typography';

// iOS tab bar content height (UITabBar), above the home indicator; the
// 44pt "+" is centred in it
const IOS_TAB_BAR_HEIGHT = 49;
// Material 3 navigation bar height, above the system navigation bar
const MATERIAL_NAV_BAR_HEIGHT = 80;
// Material 3 active indicator (primary container)
const INDICATOR_COLOR = colors.primary.container;

/**
 * The tab bar holds exactly two tabs, Today and History.
 *
 * iOS: a translucent bar over the content (the system material), with the
 * "+" Add Entry action between the two tabs. The "+" is outside the tab list,
 * so VoiceOver announces two tabs and one button.
 *
 * Android: a Material 3 navigation bar (80dp plus the system navigation bar
 * inset, active indicator pill); adding an entry is the floating action
 * button on each screen (AddEntryFab).
 */
function AppTabBar(props: BottomTabBarProps) {
  if (Platform.OS !== 'ios') {
    return <BottomTabBar {...props} />;
  }

  return (
    <View style={styles.iosTabBarContainer}>
      <BottomTabBar {...props} />
      <View style={styles.iosAddButtonSlot} pointerEvents="box-none">
        <AddTabButton />
      </View>
    </View>
  );
}

function renderTabIcon(icon: IconName, focusedIcon: IconName) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    if (Platform.OS === 'android') {
      return (
        <View
          style={[
            styles.materialIndicator,
            focused ? styles.materialIndicatorActive : undefined,
          ]}
        >
          <Icon
            name={focused ? focusedIcon : icon}
            size={iconSize.lg}
            color={String(color)}
          />
        </View>
      );
    }
    return (
      <Icon
        name={focused ? focusedIcon : icon}
        size={26}
        color={String(color)}
      />
    );
  }
  return TabIcon;
}

// The navigation bar has a fixed height: its labels grow with the font
// size only this far
const TAB_LABEL_MAX_FONT_SCALE = 1.3;

function MaterialTabLabel({
  color,
  children,
}: {
  color: ColorValue;
  children: string;
}) {
  return (
    <Text
      variant="caption1"
      style={[styles.materialLabel, { color }]}
      numberOfLines={1}
      maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE}
    >
      {children}
    </Text>
  );
}

export default function TabLayout() {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // iOS: the two tabs take the outer thirds of the bar, the "+" the middle
  const iosCentreGap = width / 6;

  return (
    <Tabs
      key={locale} // Force re-mount on locale change to update tab titles
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        // Each tab is a native stack with its own header
        headerShown: false,
        // Labels and icons of the unselected tab: 7.56:1 on the bar (text
        // contrast, as the labels are text); the selected one is brand teal
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.textSecondary,
        ...Platform.select({
          ios: {
            tabBarStyle: {
              borderTopColor: 'rgba(0, 0, 0, 0.2)',
            },
            // The navigator keeps these labels at a fixed size and shows
            // the Large Content Viewer on a long press, as UITabBar does;
            // 11pt (caption 2) is the iOS minimum (the default is 10)
            tabBarLabelStyle: {
              fontSize: typography.caption2.fontSize,
              fontWeight: '500',
            },
            tabBarBackground: () => (
              <BlurView
                tint="systemChromeMaterialLight"
                intensity={100}
                style={StyleSheet.absoluteFill}
              />
            ),
          },
          android: {
            tabBarStyle: {
              height: MATERIAL_NAV_BAR_HEIGHT + insets.bottom,
              paddingTop: 7,
              backgroundColor: colors.surfaceMuted,
              borderTopWidth: 0,
              elevation: 0,
            },
            tabBarIconStyle: {
              width: 64,
              height: 32,
            },
            // Material 3 label medium (12sp); grows with the font size up
            // to a cap, as the bar keeps its 80dp height
            tabBarLabel: MaterialTabLabel,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="(today)"
        options={{
          title: t('tabs.home'),
          tabBarButtonTestID: 'tab-today',
          tabBarIcon: renderTabIcon('calendar-today-outline', 'calendar-today'),
          tabBarItemStyle:
            Platform.OS === 'ios' ? { marginEnd: iosCentreGap } : undefined,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarButtonTestID: 'tab-history',
          tabBarIcon: renderTabIcon('calendar-month-outline', 'calendar-month'),
          tabBarItemStyle:
            Platform.OS === 'ios' ? { marginStart: iosCentreGap } : undefined,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // The bar floats over the screens so they scroll under its material
  iosTabBarContainer: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
  },
  iosAddButtonSlot: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    height: IOS_TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialIndicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialIndicatorActive: {
    backgroundColor: INDICATOR_COLOR,
  },
  materialLabel: {
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
