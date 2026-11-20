import * as React from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWindowClass } from "@/hooks/use-window-class";
import { useI18n } from "@/lib/i18n/context";
import { InDialogContext } from "@/lib/layout/presentation";
import { colors } from "@/lib/theme/colors";
import { MAX_CONTENT_WIDTH, spacing } from "@/lib/theme/styles";
import { HeaderIconButton } from "@/components/ui/header-button";

// Material 3 dialog: 28dp corners on a surface over a 32% scrim
const DIALOG_RADIUS = 28;
const SCRIM = "rgba(0, 0, 0, 0.32)";
// Tallest a form dialog grows, so it stays a dialog on tall windows
const FORM_DIALOG_MAX_HEIGHT = 760;

interface DialogFrameProps {
  children: React.ReactNode;
  /** A header row (forms: close, title, save) above the content */
  header?: React.ReactNode;
  /** Closes the dialog (tap outside it) */
  onDismiss: () => void;
  maxWidth?: number;
  /**
   * The dialog takes the height it may (forms and scrolling sheets);
   * otherwise it fits its content.
   */
  fill?: boolean;
}

/**
 * Android, wide windows: a screen presented as a centred dialog (see
 * presentsAsDialog) over a scrim that closes it when tapped. If the window
 * becomes narrow while it is open (the phone is folded), the same content
 * fills the screen instead, with its header at the top.
 */
export function DialogFrame({
  children,
  header,
  onDismiss,
  maxWidth = MAX_CONTENT_WIDTH.reading,
  fill = false,
}: DialogFrameProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { isCompact, height } = useWindowClass();

  if (isCompact) {
    // Folded with the dialog open: the same content fills the screen, with
    // its header (a sheet has none: a bar with a close button) and clear of
    // the keyboard
    return (
      <InDialogContext.Provider value>
        <KeyboardAvoidingView
          behavior="padding"
          style={[styles.fullScreen, { paddingTop: insets.top }]}
        >
          {header ?? (
            <View style={styles.closeBar}>
              <HeaderIconButton
                icon="close"
                label={t("common.close")}
                onPress={onDismiss}
                testID="dialog-close"
              />
            </View>
          )}
          <View style={styles.body}>{children}</View>
        </KeyboardAvoidingView>
      </InDialogContext.Provider>
    );
  }

  const maxHeight = height - insets.top - insets.bottom - spacing.xxl * 2;
  return (
    <InDialogContext.Provider value>
      <View style={styles.backdrop}>
        {/* The scrim: tapping outside closes, as Material dialogs do (the
            form still asks before discarding changes). Screen readers
            close with the close button or back instead. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel={t("common.close")}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        />
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.center}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.card,
              { maxWidth, maxHeight },
              fill
                ? { height: Math.min(maxHeight, FORM_DIALOG_MAX_HEIGHT) }
                : undefined,
            ]}
            accessibilityViewIsModal
          >
            {header}
            {/* Sheets have no header: space where their drag handle was */}
            <View
              style={[
                fill ? styles.body : styles.fitBody,
                header ? undefined : styles.noHeader,
              ]}
            >
              {children}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </InDialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
    minHeight: 56,
    alignItems: "center",
  },
  body: {
    flex: 1,
  },
  // A dialog that fits its content shrinks it (a scroll view inside then
  // scrolls) once the dialog reaches its largest height
  fitBody: {
    flexShrink: 1,
  },
  noHeader: {
    paddingTop: spacing.xl,
  },
  backdrop: {
    flex: 1,
    backgroundColor: SCRIM,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    // Shrinks when the keyboard takes room, so the header and Save stay on
    // screen (the scrolling content gives way)
    flexShrink: 1,
    minHeight: 0,
    borderRadius: DIALOG_RADIUS,
    overflow: "hidden",
    backgroundColor: colors.background,
    // Material 3 elevation level 3
    elevation: 6,
  },
});
