import { useHeaderHeight } from "expo-router/react-navigation";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Scrolling body of the add and edit forms, below the native header, that
 * keeps the focused field (the notes) visible above the keyboard.
 *
 * - iOS: the scroll view insets itself by the keyboard and scrolls the
 *   focused field into view (automaticallyAdjustKeyboardInsets).
 * - Android (edge-to-edge): a KeyboardAvoidingView pads the screen by the
 *   part the keyboard covers; the scroll view keeps the focused field in
 *   view when it shrinks. The content ends above the gesture or 3-button
 *   navigation bar.
 */
export function FormScrollView({
  children,
  contentContainerStyle,
}: FormScrollViewProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const scrollView = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        Platform.OS === "android"
          ? { paddingBottom: insets.bottom + 32 }
          : undefined,
        contentContainerStyle,
      ]}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  if (Platform.OS !== "android") {
    return scrollView;
  }

  // The view's layout is relative to the screen below the app bar, while the
  // keyboard position is relative to the window: offset by the app bar.
  return (
    <KeyboardAvoidingView
      style={styles.scrollView}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      {scrollView}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
});
