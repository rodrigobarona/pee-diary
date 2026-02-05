import { useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Text } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { colors, spacing } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingPage {
  key: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  color: string;
}

const PAGES: OnboardingPage[] = [
  {
    key: "welcome",
    icon: "💧",
    titleKey: "onboarding.welcome.title",
    subtitleKey: "onboarding.welcome.subtitle",
    descriptionKey: "onboarding.welcome.description",
    color: colors.primary,
  },
  {
    key: "track",
    icon: "📝",
    titleKey: "onboarding.track.title",
    subtitleKey: "onboarding.track.subtitle",
    descriptionKey: "onboarding.track.description",
    color: colors.secondary,
  },
  {
    key: "insights",
    icon: "📊",
    titleKey: "onboarding.insights.title",
    subtitleKey: "onboarding.insights.subtitle",
    descriptionKey: "onboarding.insights.description",
    color: colors.primary,
  },
];

function PageDot({
  index,
  currentIndex,
}: {
  index: number;
  currentIndex: number;
}) {
  const isActive = index === currentIndex;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 24 : 8),
    opacity: withSpring(isActive ? 1 : 0.4),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
          marginHorizontal: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

function OnboardingPageView({
  page,
  index,
  scrollX,
}: {
  page: OnboardingPage;
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const { t } = useI18n();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8]);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        paddingHorizontal: spacing.xl,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            alignItems: "center",
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: `${page.color}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 56 }}>{page.icon}</Text>
        </View>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
            marginBottom: spacing.sm,
          }}
        >
          {t(page.titleKey)}
        </Text>

        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: page.color,
            textAlign: "center",
            marginBottom: spacing.md,
          }}
        >
          {t(page.subtitleKey)}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: colors.textMuted,
            textAlign: "center",
            lineHeight: 24,
            paddingHorizontal: spacing.lg,
          }}
        >
          {t(page.descriptionKey)}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { completeOnboarding } = useDiaryStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = event.nativeEvent.contentOffset.x;
      scrollX.value = x;
      const index = Math.round(x / SCREEN_WIDTH);
      setCurrentIndex(index);
    },
    [scrollX]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeOnboarding();
      router.replace("/(tabs)");
    }
  }, [currentIndex, completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

  const isLastPage = currentIndex === PAGES.length - 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Skip button */}
      {!isLastPage ? (
        <Pressable
          onPress={handleSkip}
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 60 : 40,
            right: spacing.lg,
            zIndex: 10,
            padding: spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: colors.textMuted,
            }}
          >
            {t("onboarding.skip")}
          </Text>
        </Pressable>
      ) : null}

      {/* Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          alignItems: "center",
        }}
        style={{
          flex: 1,
        }}
      >
        {PAGES.map((page, index) => (
          <OnboardingPageView
            key={page.key}
            page={page}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: Platform.OS === "ios" ? 50 : 30,
          gap: spacing.xl,
        }}
      >
        {/* Page indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {PAGES.map((_, index) => (
            <PageDot key={index} index={index} currentIndex={currentIndex} />
          ))}
        </View>

        {/* Next/Get Started button */}
        <Pressable
          onPress={handleNext}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            {isLastPage ? t("onboarding.getStarted") : t("onboarding.next")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
