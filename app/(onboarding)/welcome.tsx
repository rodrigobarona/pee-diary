import { useFocusEffect, useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import {
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { legalUrl } from "@/constants/legal";
import { hiddenA11y } from "@/lib/a11y";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import { iconSize, radius, ripple, spacing } from "@/lib/theme/styles";
import { CONTROL_MAX_FONT_SCALE, typography } from "@/lib/theme/typography";

const IS_IOS = Platform.OS === "ios";

interface OnboardingPage {
  key: string;
  icons: { name: IconName; size: number; offset: { x: number; y: number } }[];
  // Subtitle text and illustration colour (accessible accent tokens)
  accentColor: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  // Extra notice shown in a box under the description (medical disclaimer)
  noticeKey?: string;
}

const PAGES: OnboardingPage[] = [
  {
    key: "welcome",
    icons: [
      { name: "water", size: 48, offset: { x: 0, y: 0 } },
      { name: "calendar-check-outline", size: 24, offset: { x: 40, y: -30 } },
      { name: "chart-line", size: 20, offset: { x: -45, y: 25 } },
    ],
    accentColor: colors.primary.DEFAULT,
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
    accentColor: colors.secondary.text,
    titleKey: "onboarding.track.title",
    subtitleKey: "onboarding.track.subtitle",
    descriptionKey: "onboarding.track.description",
  },
  {
    key: "share",
    icons: [
      { name: "chart-timeline-variant", size: 48, offset: { x: 0, y: 0 } },
      { name: "file-document-outline", size: 22, offset: { x: 45, y: -20 } },
      { name: "share-variant-outline", size: 20, offset: { x: -42, y: 28 } },
    ],
    accentColor: colors.primary.DEFAULT,
    titleKey: "onboarding.share.title",
    subtitleKey: "onboarding.share.subtitle",
    descriptionKey: "onboarding.share.description",
    noticeKey: "disclaimer.text",
  },
];

// Minimum heights (both grow with the font size; the bottom section also
// grows to fit the terms line on the last page)
const HEADER_HEIGHT = 56;
const BOTTOM_HEIGHT = 140;

// Page indicator dot (decorative: the dots' container announces the page)
function PageDot({
  index,
  scrollX,
  pageWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
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

// Primary button: a filled button with UIKit dimming on iOS and the
// Material ripple on Android. No haptic: it navigates.
function CTAButton({
  onPress,
  label,
  showArrow,
  testID,
}: {
  onPress: () => void;
  label: string;
  showArrow: boolean;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      android_ripple={{ color: "rgba(255, 255, 255, 0.24)", foreground: true }}
      style={({ pressed }) => [
        styles.ctaButton,
        IS_IOS && pressed ? styles.ctaButtonPressedIOS : undefined,
      ]}
    >
      <Text variant="button" tone="onAccent">
        {label}
      </Text>
      {showArrow ? (
        <Icon name="arrow-right" size={iconSize.md} color={colors.onPrimary} />
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
    <View style={styles.iconCluster} {...hiddenA11y}>
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
          <Icon
            name={icon.name}
            size={icon.size}
            color={accentColor}
            style={idx === 0 ? undefined : styles.secondaryIcon}
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
  pageWidth,
}: {
  page: OnboardingPage;
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const { t } = useI18n();

  const inputRange = [
    (index - 1) * pageWidth,
    index * pageWidth,
    (index + 1) * pageWidth,
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
    <ScrollView
      style={[styles.page, { width: pageWidth }]}
      contentContainerStyle={styles.pageScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageContent}>
        {/* Icon cluster with scale animation */}
        <Animated.View style={iconStyle}>
          <IconCluster icons={page.icons} accentColor={page.accentColor} />
        </Animated.View>

        {/* Title with fade + slide */}
        <Animated.View style={titleStyle}>
          <Text
            variant="title1"
            style={styles.title}
            accessibilityRole="header"
          >
            {t(page.titleKey)}
          </Text>
        </Animated.View>

        {/* Subtitle with staggered fade + slide */}
        <Animated.View style={subtitleStyle}>
          <Text
            variant="headline"
            style={[styles.subtitle, { color: page.accentColor }]}
          >
            {t(page.subtitleKey)}
          </Text>
        </Animated.View>

        {/* Description with cascade fade + slide */}
        <Animated.View style={descriptionStyle}>
          <Text variant="body" tone="secondary" style={styles.description}>
            {t(page.descriptionKey)}
          </Text>
        </Animated.View>

        {/* Notice (medical disclaimer on the last page) */}
        {page.noticeKey ? (
          <Animated.View style={[styles.notice, descriptionStyle]}>
            <Icon
              name="information-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text variant="subheadline" tone="secondary" style={styles.noticeText}>
              {t(page.noticeKey)}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// "By continuing, you accept the Terms of Use. See how your data is handled
// in the Privacy Policy.", with both documents as links. Shown under the
// button on the last page, which is the only way to complete onboarding
// (Skip leads there too). Body-size, dark text: this line incorporates the
// Terms, so it must be easy to read.
function TermsAcceptance() {
  const { t, locale } = useI18n();
  const parts = t("onboarding.acceptance", {
    terms: "{terms}",
    privacy: "{privacy}",
  }).split(/(\{terms\}|\{privacy\})/);

  return (
    <RNText style={styles.acceptanceText}>
      {parts.map((part, index) => {
        if (part === "{terms}" || part === "{privacy}") {
          const isTerms = part === "{terms}";
          return (
            <RNText
              key={index}
              style={styles.acceptanceLink}
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL(
                  legalUrl(isTerms ? "terms" : "privacy", locale)
                )
              }
            >
              {isTerms ? t("settings.terms") : t("settings.privacyPolicy")}
            </RNText>
          );
        }
        return part;
      })}
    </RNText>
  );
}

export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Follows rotation and window resizes (iPad, split screen)
  const { width: pageWidth } = useWindowDimensions();
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
        event.nativeEvent.contentOffset.x / pageWidth
      );
      setCurrentIndex(index);
    },
    [pageWidth]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * pageWidth,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)");
    }
  }, [currentIndex, completeOnboarding, router, pageWidth]);

  // Skip jumps to the last page, so everyone sees the medical disclaimer and
  // the terms line; only its button completes onboarding.
  const handleSkip = useCallback(() => {
    const lastIndex = PAGES.length - 1;
    scrollViewRef.current?.scrollTo({
      x: lastIndex * pageWidth,
      animated: true,
    });
    setCurrentIndex(lastIndex);
  }, [pageWidth]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * pageWidth,
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, pageWidth]);

  // Android back goes to the previous page. On the first page it leaves the
  // app (as back does on any app's first screen) rather than popping this
  // screen: the diary may be underneath (View Tutorial, the launch redirect),
  // and onboarding must only end on the last page, with the terms line.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (currentIndex > 0) {
            handleBack();
          } else {
            BackHandler.exitApp();
          }
          return true;
        }
      );
      return () => subscription.remove();
    }, [currentIndex, handleBack])
  );

  const isLastPage = currentIndex === PAGES.length - 1;
  const topPadding = insets.top;
  const bottomPadding = Math.max(insets.bottom, spacing.lg) + spacing.xs;

  return (
    <View style={styles.container}>
      {/* Header - FIXED HEIGHT, always same size */}
      <View style={[styles.header, { marginTop: topPadding }]}>
        {/* Back button - always takes space even if invisible */}
        <View style={styles.headerSide}>
          {currentIndex > 0 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                IS_IOS && pressed ? styles.pressedIOS : undefined,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              android_ripple={ripple}
              testID="onboarding-back"
            >
              <View style={styles.backButtonCircle}>
                <Icon
                  name="chevron-left"
                  size={iconSize.lg}
                  color={colors.text}
                />
              </View>
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
              style={({ pressed }) => [
                styles.skipButton,
                IS_IOS && pressed ? styles.pressedIOS : undefined,
              ]}
              accessibilityRole="button"
              android_ripple={ripple}
              testID="onboarding-skip"
            >
              <Text
                variant="body"
                tone="accent"
                style={styles.skipText}
                maxFontSizeMultiplier={CONTROL_MAX_FONT_SCALE}
              >
                {t("onboarding.skip")}
              </Text>
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
            pageWidth={pageWidth}
          />
        ))}
      </Animated.ScrollView>

      {/* Bottom section - FIXED HEIGHT */}
      <View style={[styles.bottomSection, { paddingBottom: bottomPadding }]}>
        {/* Pagination dots - fixed position */}
        {/* One element for screen readers: "Page 2 of 3" */}
        <View
          style={styles.pagination}
          accessible
          accessibilityRole="text"
          accessibilityLabel={t("a11y.settings.pageOf", {
            page: currentIndex + 1,
            total: PAGES.length,
          })}
          accessibilityLiveRegion="polite"
        >
          {PAGES.map((_, index) => (
            <PageDot
              key={index}
              index={index}
              scrollX={scrollX}
              pageWidth={pageWidth}
            />
          ))}
        </View>

        {/* Primary button */}
        <CTAButton
          onPress={handleNext}
          label={isLastPage ? t("onboarding.getStarted") : t("onboarding.next")}
          showArrow={!isLastPage}
          testID={isLastPage ? "onboarding-get-started" : "onboarding-next"}
        />

        {isLastPage ? <TermsAcceptance /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header - grows with the font size
  header: {
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  headerSide: {
    minWidth: 80,
    minHeight: HEADER_HEIGHT,
    justifyContent: "center",
  },
  // 48-point target around a 36-point circle
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  skipButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    overflow: "hidden",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  skipText: {
    fontWeight: "600",
    textAlign: "right",
  },
  skipPlaceholder: {
    width: 48,
    height: 48,
  },
  pressedIOS: {
    opacity: 0.55,
  },
  // Scroll view
  scrollView: {
    flex: 1,
  },
  page: {},
  pageScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    position: "absolute",
  },
  secondaryIcon: {
    opacity: 0.5,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: spacing.md,
    maxWidth: 320,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    maxWidth: 340,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  noticeText: {
    flex: 1,
  },
  // Bottom section - grows with the content
  bottomSection: {
    minHeight: BOTTOM_HEIGHT,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  pagination: {
    minHeight: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
  },
  // Filled button: iOS 12-point corners, Material 3 full radius
  ctaButton: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: IS_IOS ? radius.md : radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaButtonPressedIOS: {
    opacity: 0.7,
  },
  // Body size, dark text: this line incorporates the Terms, so it must be
  // easy to read
  acceptanceText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.text,
    textAlign: "center",
  },
  acceptanceLink: {
    color: colors.primary.DEFAULT,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
