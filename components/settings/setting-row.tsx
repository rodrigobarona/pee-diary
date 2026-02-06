import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme/colors";

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  externalLink?: boolean;
  children?: React.ReactNode;
}

export function SettingRow({
  icon,
  label,
  description,
  value,
  onPress,
  destructive,
  externalLink,
  children,
}: SettingRowProps) {
  const content = (
    <View style={styles.row}>
      <View
        style={[
          styles.icon,
          destructive ? styles.iconDestructive : styles.iconPrimary,
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={destructive ? colors.error : colors.primary.DEFAULT}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            destructive ? styles.labelDestructive : undefined,
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {children ? (
        children
      ) : value ? (
        <Text style={styles.value}>{value}</Text>
      ) : null}
      {onPress && !children ? (
        <MaterialCommunityIcons
          name={externalLink ? "open-in-new" : "chevron-right"}
          size={externalLink ? 18 : 20}
          color="#9CA3AF"
        />
      ) : null}
    </View>
  );

  if (onPress && !children) {
    return (
      <AnimatedPressable onPress={onPress} haptic>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

export const settingStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 56,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderCurve: "continuous",
  },
  iconPrimary: {
    backgroundColor: "rgba(0, 109, 119, 0.1)",
  },
  iconDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  labelDestructive: {
    color: colors.error,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  value: {
    fontSize: 15,
    color: "#6B7280",
  },
});
