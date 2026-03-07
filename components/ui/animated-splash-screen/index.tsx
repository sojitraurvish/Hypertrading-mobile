import * as SplashScreen from "expo-splash-screen";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withDelay,
  withTiming,
} from "react-native-reanimated";

void SplashScreen.preventAutoHideAsync();

type AnimatedSplashScreenProps = {
  backgroundColor?: string;
  accentColor?: string;
  onFinished?: () => void;
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  backgroundColor = "#030305",
  accentColor = "#4ade80",
  onFinished,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const emblemScale = useSharedValue(0.88);
  const emblemOpacity = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.75);
  const ringOpacity = useSharedValue(0);
  const splashOverlayOpacity = useSharedValue(1);

  React.useEffect(() => {
    let isMounted = true;

    const handleFinish = () => {
      if (!isMounted) return;
      setIsVisible(false);
      onFinished?.();
    };

    const runSplashSequence = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Ignore if splash is already hidden in development.
      }

      emblemOpacity.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
      emblemScale.value = withTiming(1, {
        duration: 520,
        easing: Easing.out(Easing.exp),
      });
      ringOpacity.value = withDelay(
        120,
        withTiming(0.35, { duration: 280, easing: Easing.out(Easing.cubic) }),
      );
      ringScale.value = withDelay(
        120,
        withRepeat(
          withTiming(1.04, {
            duration: 920,
            easing: Easing.inOut(Easing.quad),
          }),
          2,
          true,
        ),
      );

      wordmarkOpacity.value = withDelay(
        220,
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
      );
      subtitleOpacity.value = withDelay(
        360,
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );

      splashOverlayOpacity.value = withDelay(
        1680,
        withTiming(
          0,
          { duration: 360, easing: Easing.inOut(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(handleFinish)();
            }
          },
        ),
      );
    };

    runSplashSequence();

    return () => {
      isMounted = false;
    };
  }, [
    emblemOpacity,
    emblemScale,
    onFinished,
    ringOpacity,
    ringScale,
    splashOverlayOpacity,
    subtitleOpacity,
    wordmarkOpacity,
  ]);

  const emblemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emblemOpacity.value,
    transform: [{ scale: emblemScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const splashOverlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: splashOverlayOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        { backgroundColor },
        splashOverlayAnimatedStyle,
      ]}
    >
      <View style={styles.heroStack}>
        <Animated.View
          style={[
            styles.emblemRing,
            {
              borderColor: accentColor,
              shadowColor: accentColor,
            },
            ringAnimatedStyle,
          ]}
        />
        <Animated.View style={[styles.emblemWrap, emblemAnimatedStyle]}>
          <Image
            source={require("../../../assets/images/emblem.png")}
            style={styles.emblemImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>

      <Animated.View style={wordmarkAnimatedStyle}>
        <Image
          source={require("../../../assets/images/wordmark.png")}
          style={styles.wordmarkImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, subtitleAnimatedStyle]}>
        <Text style={styles.taglineText}>PREMIUM DERIVATIVES TERMINAL</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    zIndex: 20,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStack: {
    width: 220,
    height: 220,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emblemRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  emblemWrap: {
    width: 160,
    height: 160,
    borderRadius: 44,
    overflow: "hidden",
  },
  emblemImage: {
    width: "100%",
    height: "100%",
  },
  wordmarkImage: {
    width: 328,
    height: 88,
  },
  taglineContainer: {
    marginTop: 4,
  },
  taglineText: {
    color: "#4b5563",
    fontSize: 10,
    letterSpacing: 3.8,
    fontWeight: "600",
  },
});
