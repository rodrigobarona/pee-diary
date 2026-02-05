import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme/colors";

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

    // Log error for debugging (in production, send to crash reporting service)
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
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={colors.warning}
          />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.description}>
          We encountered an unexpected error. Please try again.
        </Text>

        {onRetry ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={colors.white}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        ) : null}

        {__DEV__ && error ? (
          <>
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={() => setShowDetails(!showDetails)}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsToggleText}>
                {showDetails ? "Hide Details" : "Show Details"}
              </Text>
              <MaterialCommunityIcons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>

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

// Hook for functional component error handling (for use with suspense)
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((err: Error) => {
    setError(err);
  }, []);

  return { error, handleError, resetError };
}

// Wrapper component for screens/routes
interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({
  children,
  screenName,
}: ScreenErrorBoundaryProps) {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // In production, you could send this to a crash reporting service
      if (__DEV__) {
        console.error(`Error in screen ${screenName}:`, error, errorInfo);
      }
    },
    [screenName]
  );

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorDetails: {
    marginTop: 12,
    maxHeight: 200,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    width: "100%",
  },
  errorDetailsContent: {
    padding: 12,
  },
  errorName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.error,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  errorMessage: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  errorStack: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    lineHeight: 14,
  },
});
