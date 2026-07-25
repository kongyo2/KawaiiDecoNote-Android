import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StickerShape } from "./StickerShape";

const TWINKLES = 18;
const CYCLE_MS = 2600;

function Twinkle({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.inOut(Easing.ease) }), -1, false),
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

// 画面全体にきらめきを散らす環境演出。
// Web版が prefers-reduced-motion を尊重しているのと同じく、端末の
// 「視差効果を減らす」設定が入っていたら静かな点だけにする。
export function SparkleLayer({ active }: { active: boolean }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const seeds = useMemo(
    () =>
      Array.from({ length: TWINKLES }, (_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: 8 + Math.random() * 10,
        delay: Math.random() * CYCLE_MS,
      })),
    [width, height],
  );

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((s) =>
        reduced ? (
          <View key={s.key} style={[styles.twinkle, styles.still, { left: s.left, top: s.top }]}>
            <StickerShape type="sparkle" size={s.size} />
          </View>
        ) : (
          <Twinkle key={s.key} left={s.left} top={s.top} size={s.size} delay={s.delay} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  twinkle: {
    position: "absolute",
  },
  still: {
    opacity: 0.5,
  },
});
