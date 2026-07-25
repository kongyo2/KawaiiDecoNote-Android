import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { chic, colors, radii, space, text } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import type { Page } from "@/lib/types";
import { StickerItem } from "@/components/board/StickerItem";
import { ArrowLayer } from "./ArrowLayer";
import { PhotoCard } from "./PhotoCard";
import { ShapeCard } from "./ShapeCard";

const CANVAS_MIN_HEIGHT = 460;
const BOTTOM_ROOM = 120;
const ASSUMED_SHAPE_HEIGHT = 120;

export function FreeformCanvas({ page }: { page: Page }) {
  const addArrow = useNotebooks((s) => s.addArrow);
  const selectedId = useUi((s) => s.selectedId);
  const select = useUi((s) => s.select);
  const connectMode = useUi((s) => s.connectMode);
  const connectFromId = useUi((s) => s.connectFromId);
  const setConnectFrom = useUi((s) => s.setConnectFrom);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [canvasW, setCanvasW] = useState<number | undefined>(undefined);

  const onMeasureHeight = (id: string, height: number) => {
    setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
  };

  const onConnectTap = (id: string) => {
    if (!connectFromId) {
      setConnectFrom(id);
      return;
    }
    if (connectFromId === id) {
      setConnectFrom(null);
      return;
    }
    addArrow(connectFromId, id);
    setConnectFrom(null);
  };

  const isEmpty = page.shapes.length === 0 && page.photos.length === 0 && page.stickers.length === 0;

  // 置いたものの一番下に合わせて紙を伸ばす。下にはいつも書き足せる余白を残す。
  const minHeight = useMemo(() => {
    let maxY = 0;
    for (const s of page.shapes) maxY = Math.max(maxY, s.y + (heights[s.id] ?? ASSUMED_SHAPE_HEIGHT));
    for (const p of page.photos) maxY = Math.max(maxY, p.y + (heights[p.id] ?? p.w));
    for (const s of page.stickers) maxY = Math.max(maxY, s.y + s.size);
    return Math.max(CANVAS_MIN_HEIGHT, maxY + BOTTOM_ROOM);
  }, [page.shapes, page.photos, page.stickers, heights]);

  return (
    <View style={[styles.canvas, { minHeight }]} onLayout={(e) => setCanvasW(e.nativeEvent.layout.width)}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => select(null)}
        accessibilityRole="button"
        accessibilityLabel="選択を解除"
      />

      {isEmpty ? (
        <Text style={styles.hint} pointerEvents="none">
          まっさらな1ページ。{"\n"}下の道具からテキスト・写真・シールを置いてみてね🌸
        </Text>
      ) : null}

      <ArrowLayer page={page} heights={heights} selectedId={selectedId} boundsWidth={canvasW} />

      {page.shapes.map((shape) => (
        <ShapeCard
          key={shape.id}
          shape={shape}
          selected={selectedId === shape.id}
          connectMode={connectMode}
          connectPending={connectFromId === shape.id}
          onSelect={() => select(shape.id)}
          onConnectTap={onConnectTap}
          onMeasureHeight={onMeasureHeight}
          boundsWidth={canvasW}
        />
      ))}

      {page.photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selected={selectedId === photo.id}
          onSelect={() => select(photo.id)}
          onMeasureHeight={onMeasureHeight}
          boundsWidth={canvasW}
        />
      ))}

      {page.stickers.map((sticker) => (
        <StickerItem
          key={sticker.id}
          sticker={sticker}
          selected={selectedId === sticker.id}
          chic
          onSelect={() => select(sticker.id)}
          boundsWidth={canvasW}
        />
      ))}

      {connectMode ? (
        <View style={styles.connectBadge} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={styles.connectText}>
            {connectFromId ? "つなぎ先のテキストをタップ🔗" : "つなぎたいテキストを2つ順にタップ🔗"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: "relative",
  },
  hint: {
    position: "absolute",
    top: 44,
    left: space.xl,
    right: space.xl,
    textAlign: "center",
    opacity: 0.45,
    ...text.handwritten,
    color: chic.ink,
  },
  connectBadge: {
    position: "absolute",
    top: space.sm,
    alignSelf: "center",
    backgroundColor: "rgba(58,58,58,0.85)",
    borderRadius: radii.small,
    paddingVertical: 5,
    paddingHorizontal: space.md,
  },
  connectText: {
    ...text.caption,
    color: colors.white,
  },
});
