import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { measure, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { colors, shadows } from "@/lib/theme";

export interface TransformPatch {
  x?: number;
  y?: number;
  w?: number;
  rot?: number;
}

interface SecondaryAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface TransformableProps {
  x: number;
  y: number;
  w: number;
  rot: number;
  minW: number;
  maxW: number;
  square?: boolean;
  selected: boolean;
  bodyDraggable?: boolean;
  showDragHandle?: boolean;
  resizable?: boolean;
  rotatable?: boolean;
  handleTint?: string;
  boundsWidth?: number | undefined;
  minY?: number;
  // 読み上げ用の名前。「シール」「テキスト」など、何を掴んでいるかを伝える。
  label?: string;
  deleteLabel?: string;
  secondaryAction?: SecondaryAction;
  onSelect: () => void;
  onChange: (patch: TransformPatch) => void;
  onDelete?: () => void;
  children: ReactNode;
}

const HANDLE = 26;

// つまみ（⠿）を上にはみ出させる分だけ、上端に確保しておく余白。
export const GRIP_RESERVE = 15;

function tintWithAlpha(hex: string): string {
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(hex);
  const base = short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : hex;
  return `${base}55`;
}

export function Transformable({
  x,
  y,
  w,
  rot,
  minW,
  maxW,
  square = false,
  selected,
  bodyDraggable = true,
  showDragHandle = false,
  resizable = true,
  rotatable = true,
  handleTint = colors.plum,
  boundsWidth,
  minY = 0,
  label,
  deleteLabel = "削除",
  secondaryAction,
  onSelect,
  onChange,
  onDelete,
  children,
}: TransformableProps) {
  const aref = useAnimatedRef<Animated.View>();
  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const sw = useSharedValue(w);
  const srot = useSharedValue(rot);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startRot = useSharedValue(0);
  const startDist = useSharedValue(1);
  const startAngle = useSharedValue(0);

  useEffect(() => {
    const clampedW = boundsWidth !== undefined ? Math.max(minW, Math.min(w, boundsWidth)) : w;
    const maxX = boundsWidth !== undefined ? Math.max(0, boundsWidth - clampedW) : Number.POSITIVE_INFINITY;
    posX.value = Math.min(maxX, Math.max(0, x));
    posY.value = Math.max(minY, y);
    sw.value = clampedW;
    srot.value = rot;
  }, [x, y, w, rot, boundsWidth, minW, minY, posX, posY, sw, srot]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }, { rotate: `${srot.value}deg` }],
    width: sw.value,
    ...(square ? { height: sw.value } : {}),
  }));

  const drag = Gesture.Pan()
    .enabled(bodyDraggable ? selected : true)
    .onStart(() => {
      startX.value = posX.value;
      startY.value = posY.value;
    })
    .onUpdate((e) => {
      const maxX = boundsWidth !== undefined ? Math.max(0, boundsWidth - sw.value) : 1e6;
      posX.value = Math.min(maxX, Math.max(0, startX.value + e.translationX));
      posY.value = Math.max(minY, startY.value + e.translationY);
    })
    .onEnd(() => {
      runOnJS(onChange)({ x: Math.round(posX.value), y: Math.round(posY.value) });
    });

  const tap = Gesture.Tap()
    .enabled(!selected)
    .onEnd(() => {
      runOnJS(onSelect)();
    });

  const bodyGesture = showDragHandle || !bodyDraggable ? tap : Gesture.Race(drag, tap);

  const resize = Gesture.Pan()
    .onStart((e) => {
      startW.value = sw.value;
      const m = measure(aref);
      if (m === null) return;
      const cx = m.pageX + m.width / 2;
      const cy = m.pageY + m.height / 2;
      startDist.value = Math.max(1, Math.hypot(e.absoluteX - cx, e.absoluteY - cy));
    })
    .onUpdate((e) => {
      const m = measure(aref);
      if (m === null) return;
      const cx = m.pageX + m.width / 2;
      const cy = m.pageY + m.height / 2;
      const d = Math.hypot(e.absoluteX - cx, e.absoluteY - cy);
      let next = Math.max(minW, Math.min(maxW, Math.round((startW.value * d) / startDist.value)));
      if (boundsWidth !== undefined) next = Math.min(next, Math.max(minW, boundsWidth - posX.value));
      sw.value = next;
    })
    .onEnd(() => {
      runOnJS(onChange)({ w: Math.round(sw.value) });
    });

  const rotate = Gesture.Pan()
    .onStart((e) => {
      startRot.value = srot.value;
      const m = measure(aref);
      if (m === null) return;
      const cx = m.pageX + m.width / 2;
      const cy = m.pageY + m.height / 2;
      startAngle.value = (Math.atan2(e.absoluteY - cy, e.absoluteX - cx) * 180) / Math.PI;
    })
    .onUpdate((e) => {
      const m = measure(aref);
      if (m === null) return;
      const cx = m.pageX + m.width / 2;
      const cy = m.pageY + m.height / 2;
      const ang = (Math.atan2(e.absoluteY - cy, e.absoluteX - cx) * 180) / Math.PI;
      srot.value = Math.round(startRot.value + (ang - startAngle.value));
    })
    .onEnd(() => {
      runOnJS(onChange)({ rot: Math.round(srot.value) });
    });

  return (
    <Animated.View ref={aref} style={[styles.root, selected ? styles.rootSelected : null, animStyle]}>
      <GestureDetector gesture={bodyGesture}>
        <View
          style={styles.body}
          accessible={label !== undefined}
          accessibilityLabel={label}
          accessibilityState={{ selected }}
        >
          {children}
        </View>
      </GestureDetector>

      {showDragHandle ? (
        <GestureDetector gesture={drag}>
          <View
            style={[styles.grip, { backgroundColor: tintWithAlpha(handleTint) }]}
            accessible
            accessibilityLabel={label ? `${label}を動かす` : "動かす"}
          >
            <Text style={[styles.gripText, { color: handleTint }]}>⠿</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && rotatable ? (
        <GestureDetector gesture={rotate}>
          <View
            style={[styles.handle, styles.rotateHandle, { borderColor: handleTint }]}
            accessible
            accessibilityLabel="ドラッグして回す"
          >
            <Text style={[styles.handleText, { color: handleTint }]}>↻</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && resizable ? (
        <GestureDetector gesture={resize}>
          <View
            style={[styles.handle, styles.resizeHandle, { borderColor: handleTint }]}
            accessible
            accessibilityLabel="ドラッグして大きさを変える"
          >
            <Text style={[styles.handleText, { color: handleTint }]}>⤡</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && secondaryAction ? (
        <Pressable
          style={[styles.secondary, { borderColor: handleTint }]}
          onPress={secondaryAction.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={secondaryAction.label}
        >
          <Text style={[styles.secondaryText, { color: handleTint }]}>{secondaryAction.icon}</Text>
        </Pressable>
      ) : null}

      {selected && onDelete ? (
        <Pressable
          style={styles.delete}
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  rootSelected: {
    zIndex: 10,
  },
  body: {
    width: "100%",
  },
  grip: {
    position: "absolute",
    left: "50%",
    marginLeft: -18,
    top: -GRIP_RESERVE,
    width: 36,
    height: GRIP_RESERVE,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  gripText: {
    fontSize: 9,
    letterSpacing: 2,
    lineHeight: 12,
  },
  handle: {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadows.handle,
  },
  rotateHandle: {
    left: -13,
    top: -13,
  },
  resizeHandle: {
    right: -13,
    bottom: -13,
  },
  handleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  secondary: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  secondaryText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  delete: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  deleteText: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
  },
});
