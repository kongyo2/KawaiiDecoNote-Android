import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { StickerShape } from "@/components/ui/StickerShape";
import { STICKER_TYPES } from "@/lib/types";

function Sprite({ index }: { index: number }) {
  const p = useSharedValue(0);
  const target = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 20 };
  }, []);

  useEffect(() => {
    p.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [p]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateX: target.dx * p.value }, { translateY: target.dy * p.value }],
  }));

  const type = STICKER_TYPES[index % STICKER_TYPES.length] ?? "star";
  return (
    <Animated.View style={[styles.sprite, style]} pointerEvents="none">
      <StickerShape type={type} size={18} />
    </Animated.View>
  );
}

/** チェックを付けたときの、シールが弾ける小さな演出（Web版 burstConfetti） */
export function Confetti() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: 6 }, (_, i) => (
        <Sprite key={i} index={i} />
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
