import { useRoute, useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet } from "react-native";

import { DialogFrame } from "@/components/ui/dialog-frame";
import { presentsAsDialog } from "@/lib/layout/presentation";

/** Whether this sheet is presented as a dialog (wide Android windows). */
export function useSheetIsDialog(): boolean {
  return presentsAsDialog(useRoute().key);
}

export const sheetDialogStyles = StyleSheet.create({
  // A sheet's scroll view inside a dialog: as tall as its content, scrolling
  // once the dialog reaches its largest height (instead of filling it)
  fit: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 1,
  },
});

interface SheetPresentationProps {
  children: React.ReactNode;
  /** The sheet scrolls (goals, export): the dialog takes the height it may */
  fill?: boolean;
  maxWidth?: number;
}

/**
 * Wraps a sheet's content. On phones (and on iOS) the sheet is the native
 * bottom sheet, so this adds nothing. On wide Android windows the sheet is
 * presented as a centred dialog (presentsAsDialog) instead of a
 * full-width bottom sheet.
 */
export function SheetPresentation({
  children,
  fill = false,
  maxWidth = 560,
}: SheetPresentationProps) {
  const route = useRoute();
  const router = useRouter();

  if (!presentsAsDialog(route.key)) {
    return <>{children}</>;
  }
  return (
    <DialogFrame onDismiss={() => router.back()} fill={fill} maxWidth={maxWidth}>
      {children}
    </DialogFrame>
  );
}
