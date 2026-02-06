import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  Text as RNText,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { spacing } from "@/lib/theme";

// Hardcoded colors to ensure they work
const COLORS = {
  primary: "#006D77",
  secondary: "#E29578",
  text: "#333333",
  textMuted: "#6B7280",
  background: "#FAFBFC",
  white: "#FFFFFF",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface OnboardingPage {
  key: string;
  icons: { name: IconName; size: number; offset: { x: number; y: number } }[];
  accentColor: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
}

const PAGES: OnboardingPage[] = [
  {
    key: "welcome",
    icons: [
      { name: "water", size: 48, offset: { x: 0, y: 0 } },
      { name: "heart-pulse", size: 24, offset: { x: 40, y: -30 } },
      { name: "chart-line", size: 20, offset: { x: -45, y: 25 } },
    ],
    accentColor: COLORS.primary,
    titleKey: "onboarding.welcome.title",
    subtitleKey: "onboarding.welcome.subtitle",
    descriptionKey: "onboarding.welcome.description",
  },
  {
    key: "track",
    icons: [
      { name: "notebook-edit-outline", size: 48, offset: { x: 0, y: 0 } },
      { name: "water-outline", size: 22, offset: { x: 42, y: -25 } },
      { name: "clock-outline", size: 20, offset: { x: -40, y: 30 } },
    ],
    accentColor: COLORS.secondary,
    titleKey: "onboarding.track.title",
    subtitleKey: "onboarding.track.subtitle",
    descriptionKey: "onboarding.track.description",
  },
  {
    key: "insights",
    icons: [
      { name: "chart-timeline-variant", size: 48, offset: { x: 0, y: 0 } },
      { name: "file-document-outline", size: 22, offset: { x: 45, y: -20 } },
      { name: "share-variant-outline", size: 20, offset: { x: -42, y: 28 } },
    ],
    accentColor: COLORS.primary,
    titleKey: "onboarding.insights.title",
    subtitleKey: "onboarding.insights.subtitle",
    descriptionKey: "onboarding.insights.description",
  },
];

// Fixed heights
const HEADER_HEIGHT = 56;
const BOTTOM_HEIGHT = 140;

// Page indicator dot
function PageDot({
  index,
  scrollX,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// CTA Button with haptics and pressed state
function CTAButton({
  onPress,
  label,
  showArrow,
}: {
  onPress: () => void;
  label: string;
  showArrow: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        height: 56,
        backgroundColor: "#006D77",
        borderRadius: 14,
        borderCurve: "continuous",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        // iOS shadow
        shadowColor: "#006D77",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isPressed ? 0.15 : 0.3,
        shadowRadius: isPressed ? 4 : 8,
        // Android elevation
        elevation: isPressed ? 2 : 6,
        // Pressed state
        opacity: isPressed ? 0.9 : 1,
        transform: [{ scale: isPressed ? 0.98 : 1 }],
      }}
    >
      <RNText
        style={{
          fontSize: 17,
          fontWeight: "600",
          color: "#FFFFFF",
          letterSpacing: -0.2,
        }}
      >
        {label}
      </RNText>
      {showArrow ? (
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
      ) : null}
    </Pressable>
  );
}

// Simple icon cluster (no animation to avoid crashes)
function IconCluster({
  icons,
  accentColor,
}: {
  icons: OnboardingPage["icons"];
  accentColor: string;
}) {
  return (
    <View style={styles.iconCluster}>
      {icons.map((icon, idx) => (
        <View
          key={idx}
          style={[
            styles.iconWrapper,
            {
              transform: [
                { translateX: icon.offset.x },
                { translateY: icon.offset.y },
              ],
              zIndex: idx === 0 ? 10 : 5 - idx,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon.name}
            size={icon.size}
            color={idx === 0 ? accentColor : `${accentColor}80`}
          />
        </View>
      ))}
    </View>
  );
}

// Individual onboarding page with staggered animations
function OnboardingPageContent({
  page,
  index,
  scrollX,
}: {
  page: OnboardingPage;
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const { t } = useI18n();

  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  // Icon cluster animation - scale + opacity
  const iconStyle = useAnimatedStyle(() => {
    const scrollValue = scrollX?.value ?? 0;

    const scale = interpolate(
      scrollValue,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollValue,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollValue,
      inputRange,
      [20, 0, 20],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  // Title animation - fade + slide (slight delay effect via different values)
  const titleStyle = useAnimatedStyle(() => {
    const scrollValue = scrollX?.value ?? 0;

    const opacity = interpolate(
      scrollValue,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollValue,
      inputRange,
      [25, 0, 25],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Subtitle animation - more offset for stagger effect
  const subtitleStyle = useAnimatedStyle(() => {
    const scrollValue = scrollX?.value ?? 0;

    const opacity = interpolate(
      scrollValue,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollValue,
      inputRange,
      [30, 0, 30],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Description animation - most offset for cascade effect
  const descriptionStyle = useAnimatedStyle(() => {
    const scrollValue = scrollX?.value ?? 0;

    const opacity = interpolate(
      scrollValue,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollValue,
      inputRange,
      [35, 0, 35],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.page}>
      <View style={styles.pageContent}>
        {/* Icon cluster with scale animation */}
        <Animated.View style={iconStyle}>
          <IconCluster icons={page.icons} accentColor={page.accentColor} />
        </Animated.View>

        {/* Title with fade + slide */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>{t(page.titleKey)}</Text>
        </Animated.View>

        {/* Subtitle with staggered fade + slide */}
        <Animated.View style={subtitleStyle}>
          <Text style={[styles.subtitle, { color: page.accentColor }]}>
            {t(page.subtitleKey)}
          </Text>
        </Animated.View>

        {/* Description with cascade fade + slide */}
        <Animated.View style={descriptionStyle}>
          <Text style={styles.description}>{t(page.descriptionKey)}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useDiaryStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      setCurrentIndex(index);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentIndex < PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)");
    }
  }, [currentIndex, completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const isLastPage = currentIndex === PAGES.length - 1;
  const topPadding = insets.top;
  const bottomPadding = Math.max(insets.bottom, 20);

  return (
    <View style={styles.container}>
      {/* Header - FIXED HEIGHT, always same size */}
      <View style={[styles.header, { marginTop: topPadding }]}>
        {/* Back button - always takes space even if invisible */}
        <View style={styles.headerSide}>
          {currentIndex > 0 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={COLORS.text}
              />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        {/* Skip button - always takes space even if invisible */}
        <View style={styles.headerSide}>
          {!isLastPage ? (
            <Pressable
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <RNText style={styles.skipText}>{t("onboarding.skip")}</RNText>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>
      </View>

      {/* Scrollable content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {PAGES.map((page, index) => (
          <OnboardingPageContent
            key={page.key}
            page={page}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      {/* Bottom section - FIXED HEIGHT */}
      <View style={[styles.bottomSection, { paddingBottom: bottomPadding }]}>
        {/* Pagination dots - fixed position */}
        <View style={styles.pagination}>
          {PAGES.map((_, index) => (
            <PageDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        {/* CTA Button - native-feeling with haptics */}
        <CTAButton
          onPress={handleNext}
          label={isLastPage ? t("onboarding.getStarted") : t("onboarding.next")}
          showArrow={!isLastPage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header - fixed height
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  headerSide: {
    width: 80,
    height: HEADER_HEIGHT,
    justifyContent: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: "500",
    textAlign: "right",
  },
  skipPlaceholder: {
    width: 40,
    height: 20,
  },
  // Scroll view
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
  },
  pageContent: {
    alignItems: "center",
    width: "100%",
  },
  iconCluster: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconWrapper: {
    position: "absolute",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    maxWidth: 300,
  },
  // Bottom section - fixed height
  bottomSection: {
    height: BOTTOM_HEIGHT,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    backgroundColor: COLORS.background,
  },
  pagination: {
    height: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
