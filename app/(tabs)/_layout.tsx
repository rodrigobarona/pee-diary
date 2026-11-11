import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// iOS tab bar content height (UITabBar), above the home indicator; the
// 44pt "+" is centred in it
const IOS_TAB_BAR_HEIGHT = 49;
// Material 3 navigation bar height, above the system navigation bar
const MATERIAL_NAV_BAR_HEIGHT = 80;
// Material 3 active indicator
const INDICATOR_COLOR = '#CDE8EA';

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
          <MaterialCommunityIcons
            name={focused ? focusedIcon : icon}
            size={24}
            color={color}
          />
        </View>
      );
    }
    return (
      <MaterialCommunityIcons
        name={focused ? focusedIcon : icon}
        size={26}
        color={color}
      />
    );
  }
  return TabIcon;
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
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor:
          Platform.OS === 'android' ? '#3F4948' : colors.textMuted,
        ...Platform.select({
          ios: {
            tabBarStyle: {
              borderTopColor: 'rgba(0, 0, 0, 0.2)',
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
              backgroundColor: '#EEF2F2',
              borderTopWidth: 0,
              elevation: 0,
            },
            tabBarIconStyle: {
              width: 64,
              height: 32,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            },
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
});
