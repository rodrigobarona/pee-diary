import * as React from "react";
import { View, type ViewProps } from "react-native";

import { columnStyle, MAX_CONTENT_WIDTH } from "@/lib/theme/styles";

interface ContentColumnProps extends ViewProps {
  /** Widest the column may grow; defaults to a readable width */
  maxWidth?: number;
}

/**
 * Centres its content and stops it growing wider than `maxWidth` on large
 * windows (unfolded foldables, tablets). On phones it is full width, so
 * nothing changes there.
 */
export function ContentColumn({
  maxWidth = MAX_CONTENT_WIDTH.reading,
  style,
  ...props
}: ContentColumnProps) {
  return <View style={[columnStyle(maxWidth), style]} {...props} />;
}
