import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

// DSN from Sentry project settings: elevacare/eleva-diary
// Configured via EXPO_PUBLIC_SENTRY_DSN environment variable
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

if (!SENTRY_DSN && !__DEV__) {
  console.warn(
    "[Sentry] DSN not configured. Set EXPO_PUBLIC_SENTRY_DSN in .env.local"
  );
}

/**
 * Initialize Sentry for error tracking and performance monitoring.
 * Should be called as early as possible in the app lifecycle.
 */
export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: __DEV__ ? "development" : "production",
    release: `${Constants.expoConfig?.slug ?? "eleva-diary"}@${
      Constants.expoConfig?.version ?? "1.0.0"
    }`,
    dist: Constants.expoConfig?.version ?? "1.0.0",

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 20% of transactions in production
    enableAutoPerformanceTracing: true,
    enableAppStartTracking: true,
    enableNativeFramesTracking: true,
    enableStallTracking: true,

    // Error capture settings
    attachScreenshot: true,
    attachViewHierarchy: false, // Can impact performance
    enableNative: true,
    enableNativeCrashHandling: true,

    // Session replay (only on errors in production)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: __DEV__ ? 0.1 : 0,

    // Profiling (requires Hermes engine)
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Event filtering
    beforeSend: (event) => {
      // In development, only send events marked as test events
      if (__DEV__) {
        const isTestEvent = event.tags?.test === "true";
        console.log("[Sentry] Event captured:", event.event_id, event.message);

        if (isTestEvent) {
          console.log("[Sentry] Sending test event to dashboard");
          return event;
        }

        // Don't send regular events in development
        return null;
      }
      return event;
    },

    // Integrations
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
      }),
    ],

    // Callback when native SDK is ready
    onReady: ({ didCallNativeInit }) => {
      if (__DEV__) {
        console.log(
          "[Sentry] SDK initialized, native init:",
          didCallNativeInit
        );
      }
    },
  });
}

/**
 * Set user context for Sentry events.
 * Call this after user identification (e.g., after onboarding).
 */
export function setSentryUser(userId: string) {
  Sentry.setUser({
    id: userId,
  });
}

/**
 * Clear user context (e.g., on logout or data reset).
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set app state context for better debugging.
 */
export function setSentryAppContext(context: {
  language?: string;
  hasCompletedOnboarding?: boolean;
  entriesCount?: number;
}) {
  Sentry.setContext("app_state", context);
}

/**
 * Add a breadcrumb for debugging.
 */
export function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

/**
 * Test function to verify Sentry integration.
 * Call this in __DEV__ to send a test event to Sentry.
 */
export function testSentryIntegration() {
  // Temporarily enable sending in dev for this test
  const testMessage = `Test message from Eleva Diary at ${new Date().toISOString()}`;

  // Force send even in development
  Sentry.withScope((scope) => {
    scope.setTag("test", "true");
    scope.setLevel("info");

    // Use captureMessage with explicit level
    const eventId = Sentry.captureMessage(testMessage, {
      level: "info",
      tags: { source: "integration_test" },
    });

    if (__DEV__) {
      console.log("[Sentry] Test event sent with ID:", eventId);
      console.log(
        "[Sentry] Check your Sentry dashboard: https://elevacare.sentry.io"
      );
    }

    return eventId;
  });
}

/**
 * Test function to send a test exception to Sentry.
 */
export function testSentryException() {
  const testError = new Error(
    "Test exception from Eleva Diary integration check"
  );

  const eventId = Sentry.captureException(testError, {
    tags: {
      test: "true",
      source: "integration_test",
    },
  });

  if (__DEV__) {
    console.log("[Sentry] Test exception sent with ID:", eventId);
  }

  return eventId;
}

// Re-export Sentry for direct access when needed
export { Sentry };
