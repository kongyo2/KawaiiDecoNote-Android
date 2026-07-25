import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, radii, shadows, space } from "@/lib/theme";
import { useUi } from "@/state/ui";
import type { Page } from "@/lib/types";
import { StickerShape } from "@/components/ui/StickerShape";
import { StickerItem } from "./StickerItem";

const BOARD_MIN_HEIGHT = 260;
const STICKER_MARGIN = 20;

function Corner({ frame, style }: { frame: Page["frame"]; style: ViewStyle }) {
  if (frame !== "star" && frame !== "aurora") return null;
  return (
    <View style={[styles.corner, style]} pointerEvents="none">
      {frame === "star" ? (
        <StickerShape type="star" size={30} c1={colors.gold} c2={colors.white} />
      ) : (
        <StickerShape type="flower" size={30} c1={colors.lavender} c2={colors.bgMid} />
      )}
    </View>
  );
}

function RibbonTag() {
  return (
    <View style={styles.ribbonTag} pointerEvents="none">
      <Svg width={42} height={42} viewBox="0 0 42 42">
        <Path
          d="M21 6 C14 2, 6 6, 8 14 C10 20, 21 24, 21 24 C21 24, 32 20, 34 14 C36 6, 28 2, 21 6 Z"
          fill={colors.rose}
        />
        <Circle cx={21} cy={14} r={3.4} fill="#FFF8F2" />
      </Svg>
    </View>
  );
}

const FRAME_STYLE: Record<Page["frame"], ViewStyle> = {
  plain: { borderWidth: 2, borderColor: colors.line, borderStyle: "dashed" },
  aurora: { boxShadow: shadows.glow, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
  star: { borderWidth: 2, borderColor: "rgba(244,213,141,0.7)", borderStyle: "dotted" },
  ribbon: { borderWidth: 2, borderColor: "rgba(232,180,188,0.55)" },
};

export function BoardFrame({ page, children }: { page: Page; children: ReactNode }) {
  const selectedId = useUi((s) => s.selectedId);
  const select = useUi((s) => s.select);
  const [layerWidth, setLayerWidth] = useState<number | undefined>(undefined);

  // シールを下へ引っぱったぶんだけ盤面を伸ばす（Web版の fitBoardForStickers 相当）。
  const stickerExtent = page.stickers.reduce((m, s) => Math.max(m, s.y + s.size + STICKER_MARGIN), 0);
  const onLayerLayout = (e: LayoutChangeEvent) => setLayerWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrap}>
      <View style={[styles.board, FRAME_STYLE[page.frame], { minHeight: Math.max(BOARD_MIN_HEIGHT, stickerExtent) }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => select(null)}
          accessibilityRole="button"
          accessibilityLabel="選択を解除"
        />

        {page.frame === "ribbon" ? <RibbonTag /> : null}
        <Corner frame={page.frame} style={styles.tl} />
        <Corner frame={page.frame} style={styles.tr} />
        <Corner frame={page.frame} style={styles.bl} />
        <Corner frame={page.frame} style={styles.br} />

        <View style={styles.content}>{children}</View>

        {/* シールは盤面いっぱいのレイヤーに置く（Web版の .sticker-layer と同じ座標系）。
            box-none にしてあるので、シールの無いところのタップは下の中身に届く。 */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayerLayout}>
          {page.stickers.map((sticker) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              selected={selectedId === sticker.id}
              chic={false}
              onSelect={() => select(sticker.id)}
              boundsWidth={layerWidth}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.lg,
  },
  board: {
    backgroundColor: colors.veil,
    borderRadius: radii.board,
    paddingTop: 34,
    paddingHorizontal: space.xl,
    paddingBottom: 30,
  },
  content: {
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
  },
  tl: { top: -6, left: -6 },
  tr: { top: -6, right: -6 },
  bl: { bottom: -6, left: -6 },
  br: { bottom: -6, right: -6 },
  ribbonTag: {
    position: "absolute",
    top: -14,
    left: "50%",
    marginLeft: -21,
    width: 42,
    height: 42,
    zIndex: 2,
  },
});
