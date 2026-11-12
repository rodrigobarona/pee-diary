import * as React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { i18n } from "@/lib/i18n";
import { colors } from "@/lib/theme/colors";
import {
  iconSize,
  MIN_TOUCH_TARGET,
  radius,
  ripple,
  spacing,
} from "@/lib/theme/styles";
import { typography } from "@/lib/theme/typography";

const IS_IOS = Platform.OS === "ios";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Errors stay on the device: the diary sends nothing to third parties.
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  // Translation keys; the generic "Something went wrong" text by default
  titleKey?: string;
  descriptionKey?: string;
  secondaryAction?: { label: string; onPress: () => void };
}

/**
 * Shown when the saved diary could not be read at launch: Try Again, or
 * (when it keeps failing) start a new diary, keeping a recovery copy.
 */
export function LoadFailedScreen({
  onRetry,
  onStartNew,
}: {
  onRetry: () => void;
  onStartNew: () => void;
}) {
  const t = (key: string) => i18n.t(key);
  const confirmStartNew = () =>
    Alert.alert(t("error.startNew"), t("error.startNewConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("error.startNew"), style: "destructive", onPress: onStartNew },
    ]);
  return (
    <DefaultErrorFallback
      error={null}
      onRetry={onRetry}
      titleKey="error.loadFailedTitle"
      descriptionKey="error.loadFailedDescription"
      secondaryAction={{ label: t("error.startNew"), onPress: confirmStartNew }}
    />
  );
}

function DefaultErrorFallback({
  error,
  onRetry,
  titleKey = "error.title",
  descriptionKey = "error.description",
  secondaryAction,
}: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  // The root error boundary sits outside I18nProvider, so read the shared
  // i18n instance directly; its locale follows the user's language setting.
  const t = (key: string) => i18n.t(key);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon
            name="alert-circle-outline"
            size={64}
            color={colors.amber.accent}
          />
        </View>

        <Text variant="title3" style={styles.title} accessibilityRole="header">
          {t(titleKey)}
        </Text>
        <Text variant="subheadline" tone="secondary" style={styles.description}>
          {t(descriptionKey)}
        </Text>

        {onRetry ? (
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              IS_IOS && pressed ? styles.pressedIOS : undefined,
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            android_ripple={{ color: "rgba(255, 255, 255, 0.24)", foreground: true }}
          >
            <Icon name="refresh" size={iconSize.md} color={colors.onPrimary} />
            <Text variant="button" tone="onAccent">
              {t("error.tryAgain")}
            </Text>
          </Pressable>
        ) : null}

        {secondaryAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.detailsToggle,
              IS_IOS && pressed ? styles.pressedIOS : undefined,
            ]}
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
            android_ripple={ripple}
          >
            <Text variant="subheadline" tone="secondary">
              {secondaryAction.label}
            </Text>
          </Pressable>
        ) : null}

        {__DEV__ && error ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.detailsToggle,
                IS_IOS && pressed ? styles.pressedIOS : undefined,
              ]}
              onPress={() => setShowDetails(!showDetails)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetails }}
              android_ripple={ripple}
            >
              <Text variant="subheadline" tone="secondary">
                {showDetails ? t("error.hideDetails") : t("error.showDetails")}
              </Text>
              <Icon
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={iconSize.sm}
                color={colors.textSecondary}
              />
            </Pressable>

            {showDetails ? (
              <ScrollView
                style={styles.errorDetails}
                contentContainerStyle={styles.errorDetailsContent}
              >
                <Text style={styles.errorName}>{error.name}</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
                {error.stack ? (
                  <Text style={styles.errorStack}>
                    {Platform.select({
                      ios: error.stack.substring(0, 500),
                      android: error.stack.substring(0, 500),
                      default: error.stack,
                    })}
                    ...
                  </Text>
                ) : null}
              </ScrollView>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const MONOSPACE = Platform.select({ ios: "Menlo", default: "monospace" });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 360,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: IS_IOS ? radius.md : radius.full,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  pressedIOS: {
    opacity: 0.6,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  errorDetails: {
    marginTop: spacing.md,
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    width: "100%",
  },
  errorDetailsContent: {
    padding: spacing.md,
  },
  errorName: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.destructive,
    marginBottom: spacing.xs,
    fontFamily: MONOSPACE,
  },
  errorMessage: {
    ...typography.caption1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontFamily: MONOSPACE,
  },
  errorStack: {
    ...typography.caption2,
    color: colors.textSecondary,
    fontFamily: MONOSPACE,
  },
});
