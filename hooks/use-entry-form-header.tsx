import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import * as React from "react";
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from "react-native";

import { HeaderIconButton, HeaderTextButton } from "@/components/ui/header-button";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

interface EntryFormHeaderOptions {
  title: string;
  // "Save" for a new entry, "Update" for an edit
  saveLabel: string;
  // Saves the form; returns false when nothing was saved (the form stays)
  onSave: () => boolean;
  // The form differs from what it started with
  isDirty: boolean;
  // Edit screen only: asks for confirmation, then calls close() if deleted
  onDelete?: (close: () => void) => void;
}

/**
 * Header of the add and edit forms, presented as a page sheet on iOS
 * (Cancel, title, Save) and as a Material 3 full-screen dialog on Android
 * (close, title, delete, Save). Closing with unsaved changes (Cancel, close,
 * swipe-down on iOS, system back on Android) asks first. A successful save
 * plays the success haptic; the edit screen's delete plays the warning
 * haptic once confirmed.
 */
export function useEntryFormHeader({
  title,
  saveLabel,
  onSave,
  isDirty,
  onDelete,
}: EntryFormHeaderOptions) {
  const { t } = useI18n();
  const navigation = useNavigation();
  const router = useRouter();
  // Set after a save or a delete, so leaving does not ask about changes
  const isClosingRef = React.useRef(false);

  const close = React.useCallback(() => {
    isClosingRef.current = true;
    router.back();
  }, [router]);

  usePreventRemove(isDirty, ({ data }) => {
    if (isClosingRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    confirmDiscard(t, () => navigation.dispatch(data.action));
  });

  // Success haptic once the entry is saved (not for Cancel or close)
  const handleSave = React.useCallback(() => {
    if (onSave()) {
      haptics.success();
      close();
    }
  }, [onSave, close]);

  const handleDelete = React.useCallback(() => {
    onDelete?.(close);
  }, [onDelete, close]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <HeaderTextButton
            label={t("common.cancel")}
            onPress={() => router.back()}
            testID="form-cancel"
          />
        ) : (
          <HeaderIconButton
            icon="close"
            label={t("common.close")}
            onPress={() => router.back()}
            testID="form-close"
          />
        ),
      headerRight: () => (
        <View style={styles.actions}>
          {/* Android: the bin in the top app bar (Material). iOS: a
              "Delete Entry" button at the end of the form (deleteEntry
              below), as Contacts and Calendar do, so the bar keeps only
              Cancel, the title and the save action. */}
          {onDelete && Platform.OS !== "ios" ? (
            <HeaderIconButton
              icon="trash-can-outline"
              label={t("common.delete")}
              onPress={handleDelete}
              color={colors.destructive}
              testID="form-delete"
            />
          ) : null}
          <HeaderTextButton
            label={saveLabel}
            onPress={handleSave}
            prominent
            testID="form-save"
          />
        </View>
      ),
    });
  }, [navigation, router, t, title, saveLabel, handleSave, handleDelete, onDelete]);

  return { close, deleteEntry: onDelete ? handleDelete : undefined };
}

// iOS: an action sheet with a destructive "Discard Changes" (HIG, Sheets);
// Android: a Material 3 dialog.
function confirmDiscard(t: (key: string) => string, onDiscard: () => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [t("common.discardChanges"), t("common.keepEditing")],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (index) => {
        if (index === 0) onDiscard();
      }
    );
    return;
  }

  Alert.alert(t("common.discardChangesTitle"), undefined, [
    { text: t("common.keepEditing"), style: "cancel" },
    { text: t("common.discard"), style: "destructive", onPress: onDiscard },
  ]);
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Platform.OS === "ios" ? 4 : 0,
  },
});
