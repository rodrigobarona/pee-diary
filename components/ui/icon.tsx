import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { colors } from '@/lib/theme/colors';
import { iconSize } from '@/lib/theme/styles';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * A decorative icon. Icon-font glyphs are private-use characters that
 * VoiceOver and TalkBack read as noise, so every icon is hidden from screen
 * readers: the control or text around it carries the accessible name.
 * Icons do not scale with the font size (as SF Symbols in bars and the
 * Material icons do not), so they never push layouts apart.
 */
export function Icon({
  name,
  size = iconSize.lg,
  color = colors.textSecondary,
  style,
}: IconProps) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={style}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      allowFontScaling={false}
    />
  );
}
