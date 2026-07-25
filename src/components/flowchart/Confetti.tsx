import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { degrees, randomOf } from "@/lib/format";
import { StickerShape } from "@/components/ui/StickerShape";
import { STICKER_TYPES } from "@/lib/types";

const SPRITES = 6;
const DURATION = 700;

function Sprite() {
  const p = useSharedValue(0);
  const seed = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 20,
      spin: degrees(Math.random() * Math.PI * 2),
      type: randomOf(STICKER_TYPES) ?? "star",
    };
  }, []);

  useEffect(() => {
    p.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
  }, [p]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: seed.dx * p.value },
      { translateY: seed.dy * p.value },
      { rotate: `${seed.spin * p.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.sprite, style]} pointerEvents="none">
      <StickerShape type={seed.type} size={18} />
    </Animated.View>
  );
}

// 工程にチェックが付いたときにシールが弾ける演出。
// 「視差効果を減らす」設定が入っている端末では出さない。
export function Confetti() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: SPRITES }, (_, i) => (
        <Sprite key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sprite: {
    position: "absolute",
  },
});
