import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, radii } from "@/lib/theme";
import { useUi } from "@/state/ui";
import type { Page } from "@/lib/types";
import { StickerShape } from "@/components/ui/StickerShape";
import { StickerItem } from "./StickerItem";

function Corner({ frame, style }: { frame: Page["frame"]; style: object }) {
  if (frame !== "star" && frame !== "aurora") return null;
  return (
    <View style={[styles.corner, style]} pointerEvents="none">
      {frame === "star" ? (
        <StickerShape type="star" size={30} c1={colors.gold} c2="#ffffff" />
      ) : (
        <StickerShape type="flower" size={30} c1={colors.lavender} c2="#fdf7f3" />
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
        <Circle cx={21} cy={14} r={3.4} fill="#fff8f2" />
      </Svg>
    </View>
  );
}

const FRAME_STYLE: Record<Page["frame"], object> = {
  plain: { borderWidth: 2, borderColor: "rgba(155,130,180,0.35)", borderStyle: "dashed" },
  aurora: { boxShadow: "0 0 40px rgba(201,182,228,0.35)", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
  star: { borderWidth: 2, borderColor: "rgba(244,213,141,0.7)", borderStyle: "dotted" },
  ribbon: { borderWidth: 2, borderColor: "rgba(232,180,188,0.55)" },
};

/** profile手帳の飾り枠つき盤面（Web版 .board の frame-* + corner + ribbon-tag） */
export function BoardFrame({ page, children }: { page: Page; children: ReactNode }) {
  const selectedId = useUi((s) => s.selectedId);
  const select = useUi((s) => s.select);

  // シールを盤面の下方向にドラッグしても切れないよう、シールの下端まで盤面を伸ばす。
  // （シールは content と同じ原点に絶対配置されるので content の minHeight で伸ばせる）
  const stickerExtent = page.stickers.reduce((m, s) => Math.max(m, s.y + s.size + 20), 0);

  return (
    <View style={styles.wrap}>
      <View style={[styles.board, FRAME_STYLE[page.frame]]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => select(null)} />

        {page.frame === "ribbon" ? <RibbonTag /> : null}
        <Corner frame={page.frame} style={styles.tl} />
        <Corner frame={page.frame} style={styles.tr} />
        <Corner frame={page.frame} style={styles.bl} />
        <Corner frame={page.frame} style={styles.br} />

        <View style={[styles.content, stickerExtent > 0 ? { minHeight: stickerExtent } : null]}>{children}</View>

        {page.stickers.map((sticker) => (
          <StickerItem
            key={sticker.id}
            sticker={sticker}
            selected={selectedId === sticker.id}
            chic={false}
            onSelect={() => select(sticker.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
  },
  board: {
    backgroundColor: colors.panel,
    borderRadius: radii.board,
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 30,
    minHeight: 260,
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
