import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import type { Arrow, Page, Shape } from "@/lib/types";

interface Geo {
  mx: number;
  my: number;
  length: number;
  angle: number;
}

const ARROW_COLOR = "#888";

// カードは Transformable 側で盤面内へクランプ描画される。矢印の端点も同じ式で
// クランプして、復元/インポート座標がはみ出していても線が実際の描画位置を指すようにする。
// 幅も Transformable と同様に盤面幅で抑える。カードが盤面より広いと描画幅が縮むため、
// shape.w のままだと中心がズレて線がカードの外を指してしまう。
function centerOf(shape: Shape, height: number, boundsWidth: number | undefined): { cx: number; cy: number } {
  const w = boundsWidth !== undefined ? Math.min(shape.w, boundsWidth) : shape.w;
  const maxX = boundsWidth !== undefined ? Math.max(0, boundsWidth - w) : Number.POSITIVE_INFINITY;
  const x = Math.min(maxX, Math.max(0, shape.x));
  const y = Math.max(0, shape.y);
  return { cx: x + w / 2, cy: y + (height || 44) / 2 };
}

function geometryFor(
  arrow: Arrow,
  shapes: Shape[],
  heights: Record<string, number>,
  boundsWidth: number | undefined,
): Geo | null {
  if (arrow.manual && arrow.length > 0) {
    return { mx: arrow.mx, my: arrow.my, length: arrow.length, angle: arrow.angle };
  }
  const from = shapes.find((s) => s.id === arrow.from);
  const to = shapes.find((s) => s.id === arrow.to);
  if (!from || !to) return null;
  const a = centerOf(from, heights[from.id] ?? 44, boundsWidth);
  const b = centerOf(to, heights[to.id] ?? 44, boundsWidth);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  return {
    mx: (a.cx + b.cx) / 2,
    my: (a.cy + b.cy) / 2,
    length: Math.max(20, Math.hypot(dx, dy)),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

function ArrowItem({ arrow, geo, selected }: { arrow: Arrow; geo: Geo; selected: boolean }) {
  const select = useUi((s) => s.select);
  const deleteArrow = useNotebooks((s) => s.deleteArrow);
  const resetArrow = useNotebooks((s) => s.resetArrow);
  const len = Math.max(20, geo.length);

  return (
    <Pressable
      onPress={() => select(arrow.id)}
      style={[
        styles.wrap,
        // 未選択の線はカードより下（描画順で背面）に置き、カードのタップを奪わない。
        // 選択中だけ前面に出して、端の削除/戻すボタンを押せるようにする。
        selected ? styles.wrapSelected : null,
        { left: geo.mx - len / 2, top: geo.my - 11, width: len, transform: [{ rotate: `${geo.angle}deg` }] },
      ]}
    >
      <View style={[styles.line, { backgroundColor: ARROW_COLOR }, selected && styles.lineSelected]} />
      <View style={[styles.head, { borderLeftColor: ARROW_COLOR }]} />
      {selected ? (
        <>
          <Pressable style={[styles.btn, styles.del]} onPress={() => deleteArrow(arrow.id)} hitSlop={6}>
            <Text style={styles.delText}>✕</Text>
          </Pressable>
          {arrow.manual ? (
            <Pressable style={[styles.btn, styles.reset]} onPress={() => resetArrow(arrow.id)} hitSlop={6}>
              <Text style={styles.resetText}>↺</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

export function ArrowLayer({
  page,
  heights,
  selectedId,
  boundsWidth,
}: {
  page: Page;
  heights: Record<string, number>;
  selectedId: string | null;
  boundsWidth?: number | undefined;
}) {
  return (
    <>
      {page.arrows.map((arrow) => {
        const geo = geometryFor(arrow, page.shapes, heights, boundsWidth);
        if (!geo) return null;
        return <ArrowItem key={arrow.id} arrow={arrow} geo={geo} selected={selectedId === arrow.id} />;
      })}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    height: 22,
    justifyContent: "center",
  },
  wrapSelected: {
    zIndex: 3,
  },
  line: {
    position: "absolute",
    left: 0,
    right: 9,
    top: "50%",
    height: 2.5,
    marginTop: -1.25,
    borderRadius: 2,
  },
  lineSelected: {
    boxShadow: "0 0 0 3px rgba(155,130,180,0.25)",
  },
  head: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 9,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  btn: {
    position: "absolute",
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  del: {
    right: -9,
    borderColor: colors.rose,
  },
  delText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.rose,
  },
  reset: {
    left: -9,
    borderColor: colors.lavender,
  },
  resetText: {
    fontSize: 12,
    color: colors.plum,
  },
});
