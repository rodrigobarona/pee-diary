import * as React from "react";
import { StyleSheet } from "react-native";
import { Text } from "./text";

interface SectionTitleProps {
  children: string;
}

/**
 * Section label for form sections.
 * Design brief: No all-caps text - use sentence case instead.
 */
export function SectionTitle({ children }: SectionTitleProps) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    // Design brief: No all-caps - removed textTransform: 'uppercase'
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
});
