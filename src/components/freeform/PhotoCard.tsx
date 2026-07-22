import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { useNotebooks } from "@/state/notebooks";
import type { Photo } from "@/lib/types";
import { Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

const CHIC_HANDLE = "#555";

export function PhotoCard({
  photo,
  selected,
  onSelect,
  onMeasureHeight,
}: {
  photo: Photo;
  selected: boolean;
  onSelect: () => void;
  onMeasureHeight: (id: string, height: number) => void;
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
      minW={60}
      maxW={420}
      selected={selected}
      bodyDraggable
      handleTint={CHIC_HANDLE}
      onSelect={onSelect}
      onChange={onChange}
      onDelete={() => deletePhoto(photo.id)}
    >
      <Image
        source={{ uri: photo.dataUrl }}
        style={[styles.img, { aspectRatio: ratio }]}
        resizeMode="cover"
        onLayout={(e: LayoutChangeEvent) => onMeasureHeight(photo.id, e.nativeEvent.layout.height)}
      />
    </Transformable>
  );
}

const styles = StyleSheet.create({
  img: {
    width: "100%",
    height: undefined,
    borderRadius: 10,
    boxShadow: "0 1px 6px rgba(0,0,0,0.14)",
  },
});
