import { colors } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { Sticker } from "@/lib/types";
import { StickerShape } from "@/components/ui/StickerShape";
import { Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

export function StickerItem({
  sticker,
  selected,
  chic,
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
    // シールは正方形。リサイズ幅は size として保存する。
    const next: { x?: number; y?: number; rot?: number; size?: number } = {};
    if (patch.x !== undefined) next.x = patch.x;
    if (patch.y !== undefined) next.y = patch.y;
    if (patch.rot !== undefined) next.rot = patch.rot;
    if (patch.w !== undefined) next.size = patch.w;
    updateSticker(sticker.id, next);
  };

  return (
    <Transformable
      x={sticker.x}
      y={sticker.y}
      w={sticker.size}
      rot={sticker.rot}
      minW={20}
      maxW={160}
      square
      selected={selected}
      bodyDraggable
      handleTint={chic ? "#555" : colors.plum}
      boundsWidth={boundsWidth}
      onSelect={onSelect}
      onChange={onChange}
      onDelete={() => deleteSticker(sticker.id)}
    >
      <StickerShape type={sticker.type} size={sticker.size} />
    </Transformable>
  );
}
