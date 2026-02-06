import * as React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface FormCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * White card container with shadow for form sections.
 * Uses modern styling: borderCurve, boxShadow, gap.
 */
export function FormCard({ children, style }: FormCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    marginBottom: 16,
    // Modern shadow syntax - subtle per design brief
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
});
