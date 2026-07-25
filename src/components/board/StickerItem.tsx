import { chic, colors } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { STICKER_MAX_SIZE, STICKER_MIN_SIZE } from "@/lib/types";
import type { Sticker } from "@/lib/types";
import { StickerShape, stickerLabel } from "@/components/ui/StickerShape";
import { Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

export function StickerItem({
  sticker,
  selected,
  chic: chicMode,
  onSelect,
  boundsWidth,
}: {
  sticker: Sticker;
  selected: boolean;
  chic: boolean;
  onSelect: () => void;
  boundsWidth?: number | undefined;
}) {
  const updateSticker = useNotebooks((s) => s.updateSticker);
  const deleteSticker = useNotebooks((s) => s.deleteSticker);

  const onChange = (patch: TransformPatch) => {
    const next: { x?: number; y?: number; rot?: number; size?: number } = {};
    if (patch.x !== undefined) next.x = patch.x;
    if (patch.y !== undefined) next.y = patch.y;
    if (patch.rot !== undefined) next.rot = patch.rot;
    if (patch.w !== undefined) next.size = patch.w;
    updateSticker(sticker.id, next);
  };

  const name = `${stickerLabel(sticker.type)}のシール`;

  return (
    <Transformable
      x={sticker.x}
      y={sticker.y}
      w={sticker.size}
      rot={sticker.rot}
      minW={STICKER_MIN_SIZE}
      maxW={STICKER_MAX_SIZE}
      square
      selected={selected}
      bodyDraggable
      handleTint={chicMode ? chic.handle : colors.plum}
      boundsWidth={boundsWidth}
      label={name}
      deleteLabel={`${name}をはがす`}
      onSelect={onSelect}
      onChange={onChange}
      onDelete={() => deleteSticker(sticker.id)}
    >
      <StickerShape type={sticker.type} size={sticker.size} />
    </Transformable>
  );
}
