import { BREAKPOINTS } from "@/lib/theme/styles";

export type WidthClass = "compact" | "medium" | "expanded";

/** The width class of a window `width` wide (dp on Android, pt on iOS). */
export function widthClassFor(width: number): WidthClass {
  if (width >= BREAKPOINTS.expanded) return "expanded";
  if (width >= BREAKPOINTS.medium) return "medium";
  return "compact";
}

/**
 * Whether two panes side by side keep each pane at least `minPaneWidth`
 * wide at the current text size. Large text needs wider panes, so a big
 * font scale falls back to one pane even on a wide window.
 */
export function fitsTwoPanes(
  width: number,
  fontScale: number,
  { minPaneWidth = 320, gutter = 24 }: { minPaneWidth?: number; gutter?: number } = {}
): boolean {
  const scaledPane = minPaneWidth * Math.max(1, fontScale);
  return width - gutter >= scaledPane * 2;
}
