import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { chic, radii, shadows } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { PHOTO_MAX_WIDTH, PHOTO_MIN_WIDTH } from "@/lib/types";
import type { Photo } from "@/lib/types";
import { Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

export function PhotoCard({
  photo,
  selected,
  onSelect,
  onMeasureHeight,
  boundsWidth,
}: {
  photo: Photo;
  selected: boolean;
  onSelect: () => void;
  onMeasureHeight: (id: string, height: number) => void;
  boundsWidth?: number | undefined;
}) {
  const updatePhoto = useNotebooks((s) => s.updatePhoto);
  const deletePhoto = useNotebooks((s) => s.deletePhoto);
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      photo.dataUrl,
      (w, h) => {
        if (alive && h > 0) setRatio(w / h);
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [photo.dataUrl]);

  const onChange = (patch: TransformPatch) => updatePhoto(photo.id, patch);

  return (
    <Transformable
      x={photo.x}
      y={photo.y}
      w={photo.w}
      rot={photo.rot}
      minW={PHOTO_MIN_WIDTH}
      maxW={PHOTO_MAX_WIDTH}
      selected={selected}
      bodyDraggable
      handleTint={chic.handle}
      boundsWidth={boundsWidth}
      label="写真"
      deleteLabel="この写真をはがす"
      onSelect={onSelect}
      onChange={onChange}
      onDelete={() => deletePhoto(photo.id)}
    >
      <Image
        source={{ uri: photo.dataUrl }}
        style={[styles.img, { aspectRatio: ratio }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onLayout={(e: LayoutChangeEvent) => onMeasureHeight(photo.id, e.nativeEvent.layout.height)}
      />
    </Transformable>
  );
}

const styles = StyleSheet.create({
  img: {
    width: "100%",
    height: undefined,
    borderRadius: radii.small,
    boxShadow: shadows.chicCard,
  },
});
