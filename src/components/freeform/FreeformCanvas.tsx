import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import type { Page } from "@/lib/types";
import { StickerItem } from "@/components/board/StickerItem";
import { ArrowLayer } from "./ArrowLayer";
import { PhotoCard } from "./PhotoCard";
import { ShapeCard } from "./ShapeCard";

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

  const minHeight = useMemo(() => {
    let maxY = 0;
    for (const s of page.shapes) maxY = Math.max(maxY, s.y + (heights[s.id] ?? 120));
    for (const p of page.photos) maxY = Math.max(maxY, p.y + (heights[p.id] ?? p.w));
    for (const s of page.stickers) maxY = Math.max(maxY, s.y + s.size);
    return Math.max(460, maxY + 120);
  }, [page.shapes, page.photos, page.stickers, heights]);

  return (
    <View style={[styles.canvas, { minHeight }]} onLayout={(e) => setCanvasW(e.nativeEvent.layout.width)}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => select(null)} />

      {isEmpty ? (
        <Text style={styles.hint} pointerEvents="none">
          ここにテキストや写真、シールを{"\n"}自由に置いてみてね🌸
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
        <View style={styles.connectBadge} pointerEvents="none">
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
    top: 40,
    left: 24,
    right: 24,
    textAlign: "center",
    opacity: 0.4,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.chicInk,
    lineHeight: 24,
  },
  connectBadge: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    backgroundColor: "rgba(58,58,58,0.85)",
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  connectText: {
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 11,
  },
});
