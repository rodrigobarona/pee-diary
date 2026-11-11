import * as React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { switchColors } from './toggle-row';
import { a11yLabel, hiddenA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { colors } from '@/lib/theme/colors';
import { iconSize, radius, ripple, spacing } from '@/lib/theme/styles';

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
        <Text
          variant={IS_IOS ? 'footnote' : 'subheadline'}
          tone={IS_IOS ? 'secondary' : 'accent'}
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
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
    ? colors.destructive
    : IS_IOS
      ? colors.primary.DEFAULT
      : colors.textSecondary;

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
        <Icon name={icon} size={IS_IOS ? 18 : iconSize.lg} color={tint} />
      </View>
      <View style={styles.textContainer}>
        <Text variant="body" tone={destructive ? 'destructive' : 'primary'}>
          {label}
        </Text>
        {description ? (
          <Text
            variant={IS_IOS ? 'footnote' : 'subheadline'}
            tone="secondary"
            style={styles.description}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          variant={IS_IOS ? 'body' : 'subheadline'}
          tone="secondary"
          style={styles.value}
        >
          {value}
        </Text>
      ) : null}
      {trailing}
      {isSwitch ? (
        // The row handles the touch and the accessibility; the switch only
        // shows the state, so one tap anywhere toggles it once
        <View pointerEvents="none" {...hiddenA11y}>
          <Switch
            value={switchValue}
            trackColor={switchColors.trackColor}
            thumbColor={switchColors.thumbColor(switchValue)}
            ios_backgroundColor={switchColors.iosBackgroundColor}
          />
        </View>
      ) : null}
      {accessory === 'external' ? (
        <Icon name="open-in-new" size={18} color={colors.textSecondary} />
      ) : null}
      {accessory === 'disclosure' && IS_IOS ? (
        <Icon name="chevron-right" size={22} color={colors.chevron} />
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
        accessibilityLabel={a11yLabel(label, value, description)}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  const handlePress = isSwitch
    ? () => {
        haptics.toggle(!switchValue);
        onSwitchChange(!switchValue);
      }
    : onPress;

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessibilityRole={
        isSwitch ? 'switch' : accessory === 'external' ? 'link' : 'button'
      }
      accessibilityLabel={isSwitch ? label : a11yLabel(label, value)}
      accessibilityHint={description}
      accessibilityState={isSwitch ? { checked: switchValue } : undefined}
      android_ripple={ripple}
      style={({ pressed }) => [
        rowStyle,
        IS_IOS && pressed ? styles.rowPressedIOS : undefined,
      ]}
    >
      {content}
    </Pressable>
  );
}

// iOS row inset: leading padding + icon tile + gap
const IOS_TILE = 30;

const styles = StyleSheet.create({
  section: Platform.select({
    ios: { marginTop: spacing.xl },
    default: { marginTop: spacing.lg },
  }),
  sectionTitle: Platform.select({
    ios: {
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginStart: spacing.lg,
    },
    default: {
      // Material 3 list subheader (title small, primary)
      fontWeight: '500',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
  }),
  group: Platform.select({
    ios: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    default: {},
  }),
  // Inset to the start of the text, as in iOS lists
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8', // iOS separator (decorative)
    marginStart: spacing.lg + IOS_TILE + spacing.md,
  },
  row: Platform.select({
    ios: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 44,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
    },
    default: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      minHeight: 56,
      paddingVertical: spacing.sm,
      paddingStart: spacing.lg,
      paddingEnd: spacing.xl,
    },
  }),
  rowTwoLine: Platform.select({
    ios: {},
    default: { minHeight: 72 },
  }),
  rowPressedIOS: {
    backgroundColor: colors.highlight,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // iOS Settings-style icon tile
  iconTile: {
    width: IOS_TILE,
    height: IOS_TILE,
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.subtle,
  },
  iconTileDestructive: {
    width: IOS_TILE,
    height: IOS_TILE,
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: colors.category.leak.container,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xxs,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
