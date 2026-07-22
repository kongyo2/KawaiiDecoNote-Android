import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StickerShape } from "./StickerShape";

function Twinkle({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
  }, [progress, delay]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const pulse = 1 - Math.abs(t - 0.5) * 2;
    return {
      opacity: 0.85 * pulse,
      transform: [{ scale: 0.6 + 0.4 * pulse }, { rotate: `${8 * pulse}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.twinkle, { left, top }, style]} pointerEvents="none">
      <StickerShape type="sparkle" size={size} />
    </Animated.View>
  );
}

export function SparkleLayer({ active }: { active: boolean }) {
  const { width, height } = useWindowDimensions();
  const seeds = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: 8 + Math.random() * 10,
        delay: Math.random() * 2600,
      })),
    [width, height],
  );

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((s) => (
        <Twinkle key={s.key} left={s.left} top={s.top} size={s.size} delay={s.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  twinkle: {
    position: "absolute",
  },
});
