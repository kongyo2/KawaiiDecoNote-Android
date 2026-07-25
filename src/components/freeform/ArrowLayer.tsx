import { StyleSheet, View } from "react-native";
import { GRIP_RESERVE, Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";
import { clamp, degrees } from "@/lib/format";
import { chic } from "@/lib/theme";
import { ARROW_MAX_LENGTH, ARROW_MIN_LENGTH, UNMEASURED_SHAPE_HEIGHT } from "@/lib/types";
import type { Arrow, Page, Shape } from "@/lib/types";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

interface Geo {
  mx: number;
  my: number;
  length: number;
  angle: number;
}

export const ARROW_HEIGHT = 22;

// 手で動かした矢印の中心を紙の中に留めておくための余白。線そのものは
// 回転して紙からはみ出してもよいが、中心（＝掴める場所）が紙の外に出ると
// 選び直せず、消すことも戻すこともできなくなる。
const CENTER_MARGIN = 24;

function centerOf(shape: Shape, height: number, boundsWidth: number | undefined): { cx: number; cy: number } {
  const w = boundsWidth !== undefined ? Math.min(shape.w, boundsWidth) : shape.w;
  const maxX = boundsWidth !== undefined ? Math.max(0, boundsWidth - w) : Number.POSITIVE_INFINITY;
  const x = Math.min(maxX, Math.max(0, shape.x));
  const y = Math.max(GRIP_RESERVE, shape.y);
  return { cx: x + w / 2, cy: y + (height || UNMEASURED_SHAPE_HEIGHT) / 2 };
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
  const a = centerOf(from, heights[from.id] ?? UNMEASURED_SHAPE_HEIGHT, boundsWidth);
  const b = centerOf(to, heights[to.id] ?? UNMEASURED_SHAPE_HEIGHT, boundsWidth);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  return {
    mx: (a.cx + b.cx) / 2,
    my: (a.cy + b.cy) / 2,
    length: Math.max(ARROW_MIN_LENGTH, Math.hypot(dx, dy)),
    angle: degrees(Math.atan2(dy, dx)),
  };
}

function ArrowItem({
  arrow,
  geo,
  selected,
  boundsWidth,
}: {
  arrow: Arrow;
  geo: Geo;
  selected: boolean;
  boundsWidth: number | undefined;
}) {
  const select = useUi((s) => s.select);
  const updateArrow = useNotebooks((s) => s.updateArrow);
  const deleteArrow = useNotebooks((s) => s.deleteArrow);
  const resetArrow = useNotebooks((s) => s.resetArrow);

  const len = Math.max(ARROW_MIN_LENGTH, geo.length);
  const left = geo.mx - len / 2;
  const top = geo.my - ARROW_HEIGHT / 2;

  // 中央＋長さ＋角度で持っている矢印を、左上＋幅＋回転で扱う Transformable に橋渡しする。
  // ドラッグ・拡大・回転のどれかを触った時点で「手動配置」に切り替わる。
  // 丸めるのは箱の左上ではなく中心。回転した矢印では箱の左上が紙の外に出るのは
  // 正常（縦向きの線など）なので、掴める中心のほうを紙の中に留める。
  const onChange = (patch: TransformPatch) => {
    const nextLen = patch.w ?? len;
    const cx = (patch.x ?? left) + nextLen / 2;
    const cy = (patch.y ?? top) + ARROW_HEIGHT / 2;
    updateArrow(arrow.id, {
      manual: true,
      mx: Math.round(
        boundsWidth === undefined ? cx : clamp(cx, CENTER_MARGIN, Math.max(CENTER_MARGIN, boundsWidth - CENTER_MARGIN)),
      ),
      my: Math.round(Math.max(CENTER_MARGIN, cy)),
      length: Math.round(nextLen),
      angle: Math.round(patch.rot ?? geo.angle),
    });
  };

  return (
    <Transformable
      x={left}
      y={top}
      w={len}
      rot={geo.angle}
      minW={ARROW_MIN_LENGTH}
      maxW={ARROW_MAX_LENGTH}
      selected={selected}
      bodyDraggable
      handleTint={chic.handle}
      // 矢印は回転させて使うので、箱の左上はキャンバス上の位置と一致しない。
      // ここを紙の幅で丸めると、離れた図形をつなぐ長い線が縮んで届かなくなる。
      bounded={false}
      label="つなぎ線"
      deleteLabel="このつなぎ線を消す"
      {...(arrow.manual
        ? { secondaryAction: { icon: "↺", label: "自動の位置に戻す", onPress: () => resetArrow(arrow.id) } }
        : {})}
      onSelect={() => select(arrow.id)}
      onChange={onChange}
      onDelete={() => deleteArrow(arrow.id)}
    >
      <View style={styles.body}>
        <View style={[styles.line, selected && styles.lineSelected]} />
        <View style={styles.head} />
      </View>
    </Transformable>
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
        return (
          <ArrowItem
            key={arrow.id}
            arrow={arrow}
            geo={geo}
            selected={selectedId === arrow.id}
            boundsWidth={boundsWidth}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    height: ARROW_HEIGHT,
    justifyContent: "center",
  },
  line: {
    position: "absolute",
    left: 0,
    right: 9,
    top: "50%",
    height: 2.5,
    marginTop: -1.25,
    borderRadius: 2,
    backgroundColor: chic.arrow,
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
    borderLeftColor: chic.arrow,
  },
});
