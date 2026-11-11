import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from './text';
import { colors } from '@/lib/theme/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const IS_IOS = Platform.OS === 'ios';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

/**
 * A group of settings rows.
 * iOS: an inset grouped list (section header above a rounded group, rows
 * separated by inset hairlines).
 * Android: a Material list, rows full width under a section header.
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      {title ? (
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={styles.group}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            {index > 0 && IS_IOS ? <View style={styles.separator} /> : null}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  icon: IconName;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  // disclosure: opens another screen (chevron on iOS only, as on Android
  // list items do not use chevrons); external: opens a web page
  accessory?: 'disclosure' | 'external';
  destructive?: boolean;
  // A switch row: the whole row toggles it
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  // Shown at the end of the row (a spinner while a backup runs)
  trailing?: React.ReactNode;
  testID?: string;
}

export function SettingsRow({
  icon,
  label,
  description,
  value,
  onPress,
  accessory,
  destructive = false,
  switchValue,
  onSwitchChange,
  trailing,
  testID,
}: SettingsRowProps) {
  const isSwitch = onSwitchChange !== undefined;
  const tint = destructive
    ? colors.error
    : IS_IOS
      ? colors.primary.DEFAULT
      : '#3F4948';

  const content = (
    <>
      <View
        style={[
          styles.iconContainer,
          IS_IOS
            ? destructive
              ? styles.iconTileDestructive
              : styles.iconTile
            : undefined,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={IS_IOS ? 18 : 24}
          color={tint}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.label, destructive ? styles.labelDestructive : undefined]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {trailing}
      {isSwitch ? (
        // The row handles the touch and the accessibility; the switch only
        // shows the state, so one tap anywhere toggles it once
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Switch
            value={switchValue}
            trackColor={{ false: '#E2E8F0', true: colors.primary.DEFAULT }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
          />
        </View>
      ) : null}
      {accessory === 'external' ? (
        <MaterialCommunityIcons
          name="open-in-new"
          size={18}
          color="#6B7280"
          accessible={false}
          importantForAccessibility="no"
        />
      ) : null}
      {accessory === 'disclosure' && IS_IOS ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#C4C4C7"
          accessible={false}
          importantForAccessibility="no"
        />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    description ? styles.rowTwoLine : undefined,
  ];

  if (!onPress && !isSwitch) {
    return (
      <View
        style={rowStyle}
        accessible
        accessibilityLabel={[label, value, description].filter(Boolean).join(', ')}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  const handlePress = isSwitch
    ? () => onSwitchChange(!switchValue)
    : onPress;

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessibilityRole={
        isSwitch ? 'switch' : accessory === 'external' ? 'link' : 'button'
      }
      accessibilityLabel={isSwitch ? label : [label, value].filter(Boolean).join(', ')}
      accessibilityHint={description}
      accessibilityState={isSwitch ? { checked: switchValue } : undefined}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      style={({ pressed }) => [
        rowStyle,
        IS_IOS && pressed ? styles.rowPressedIOS : undefined,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: Platform.select({
    ios: { marginTop: 24 },
    default: { marginTop: 16 },
  }),
  sectionTitle: Platform.select({
    ios: {
      fontSize: 13,
      fontWeight: '400',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 6,
      marginStart: 16,
    },
    default: {
      // Material 3 list subheader (title small, primary)
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary.DEFAULT,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
  }),
  group: Platform.select({
    ios: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    default: {},
  }),
  // Inset to the start of the text, as in iOS lists
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginStart: 16 + 30 + 12,
  },
  row: Platform.select({
    ios: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    default: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      minHeight: 56,
      paddingVertical: 8,
      paddingStart: 16,
      paddingEnd: 24,
    },
  }),
  rowTwoLine: Platform.select({
    ios: {},
    default: { minHeight: 72 },
  }),
  rowPressedIOS: {
    backgroundColor: '#E5E5EA',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // iOS Settings-style icon tile
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(0, 109, 119, 0.1)',
  },
  iconTileDestructive: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  labelDestructive: {
    color: colors.error,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  value: {
    fontSize: 15,
    color: '#6B7280',
  },
});
