import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { measure, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { colors } from "@/lib/theme";

export interface TransformPatch {
  x?: number;
  y?: number;
  w?: number;
  rot?: number;
}

interface TransformableProps {
  x: number;
  y: number;
  /** 幅（シールは正方形なので高さも兼ねる） */
  w: number;
  rot: number;
  minW: number;
  maxW: number;
  /** シールのように高さ＝幅で正方形にするか */
  square?: boolean;
  selected: boolean;
  /** 本体全体をドラッグ対象にするか（シール・写真=true、テキストは専用グリップ=false） */
  bodyDraggable?: boolean;
  /** テキストカード用の上部ドラッググリップを出すか */
  showDragHandle?: boolean;
  resizable?: boolean;
  rotatable?: boolean;
  /** ハンドルの色（notestyleのシックモードは黒系） */
  handleTint?: string;
  /** 置ける領域の幅。ドラッグ位置を [0, boundsWidth - 幅] に収める（未指定なら x,y>=0 のみ） */
  boundsWidth?: number | undefined;
  onSelect: () => void;
  onChange: (patch: TransformPatch) => void;
  onDelete?: () => void;
  children: ReactNode;
}

const HANDLE = 26;

/** hex色に約33%の透明度を足す。3桁hex(#rgb)は6桁に伸ばしてから付ける（#555+55=#55555 の不正色を防ぐ） */
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

  // ドラッグ／リサイズ／回転の開始値
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startRot = useSharedValue(0);
  const startDist = useSharedValue(1);
  const startAngle = useSharedValue(0);

  // 外から値が変わった（undo・復元・別ページ）ときに共有値を同期
  useEffect(() => {
    posX.value = x;
    posY.value = y;
    sw.value = w;
    srot.value = rot;
  }, [x, y, w, rot, posX, posY, sw, srot]);

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
      // 盤面の外（左・上、および領域幅を超える右）へ出て掴めなくならないよう位置を制限。
      // 下方向は盤面が伸びるので上限なし。boundsWidth 未指定時は x,y>=0 のみ。
      const maxX = boundsWidth !== undefined ? Math.max(0, boundsWidth - sw.value) : 1e6;
      posX.value = Math.min(maxX, Math.max(0, startX.value + e.translationX));
      posY.value = Math.max(0, startY.value + e.translationY);
    })
    .onEnd(() => {
      runOnJS(onChange)({ x: Math.round(posX.value), y: Math.round(posY.value) });
    });

  const tap = Gesture.Tap()
    .enabled(!selected)
    .onEnd(() => {
      runOnJS(onSelect)();
    });

  // グリップでドラッグ（showDragHandle）or ドラッグ手段なし（接続モードのテキスト等）の
  // ときは本体タップのみ。本体ドラッグはシール・写真（bodyDraggable）だけに限る。
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
      const next = Math.round((startW.value * d) / startDist.value);
      sw.value = Math.max(minW, Math.min(maxW, next));
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
    <Animated.View ref={aref} style={[styles.root, animStyle]}>
      <GestureDetector gesture={bodyGesture}>
        <View style={styles.body}>{children}</View>
      </GestureDetector>

      {showDragHandle ? (
        <GestureDetector gesture={drag}>
          <View style={[styles.grip, { backgroundColor: tintWithAlpha(handleTint) }]}>
            <Text style={[styles.gripText, { color: handleTint }]}>⠿</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && rotatable ? (
        <GestureDetector gesture={rotate}>
          <View style={[styles.handle, styles.rotateHandle, { borderColor: handleTint }]}>
            <Text style={[styles.handleText, { color: handleTint }]}>↻</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && resizable ? (
        <GestureDetector gesture={resize}>
          <View style={[styles.handle, styles.resizeHandle, { borderColor: handleTint }]}>
            <Text style={[styles.handleText, { color: handleTint }]}>⤡</Text>
          </View>
        </GestureDetector>
      ) : null}

      {selected && onDelete ? (
        <Pressable style={styles.delete} onPress={onDelete} hitSlop={6}>
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
  body: {
    width: "100%",
  },
  grip: {
    position: "absolute",
    left: "50%",
    marginLeft: -18,
    top: -15,
    width: 36,
    height: 15,
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
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
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
