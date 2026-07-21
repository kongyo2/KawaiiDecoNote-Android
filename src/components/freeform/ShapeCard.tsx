import { StyleSheet, TextInput, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { Shape } from "@/lib/types";
import { Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

const CHIC_HANDLE = "#555";

export function ShapeCard({
  shape,
  selected,
  connectMode,
  connectPending,
  onSelect,
  onConnectTap,
  onMeasureHeight,
}: {
  shape: Shape;
  selected: boolean;
  connectMode: boolean;
  connectPending: boolean;
  onSelect: () => void;
  onConnectTap: (id: string) => void;
  onMeasureHeight: (id: string, height: number) => void;
}) {
  const setShapeText = useNotebooks((s) => s.setShapeText);
  const updateShape = useNotebooks((s) => s.updateShape);
  const deleteShape = useNotebooks((s) => s.deleteShape);

  const onChange = (patch: TransformPatch) => updateShape(shape.id, patch);
  const onLayout = (e: LayoutChangeEvent) => onMeasureHeight(shape.id, e.nativeEvent.layout.height);

  return (
    <Transformable
      x={shape.x}
      y={shape.y}
      w={shape.w}
      rot={shape.rot}
      minW={80}
      maxW={420}
      selected={connectMode ? false : selected}
      bodyDraggable={false}
      showDragHandle={!connectMode}
      handleTint={CHIC_HANDLE}
      onSelect={() => (connectMode ? onConnectTap(shape.id) : onSelect())}
      onChange={onChange}
      onDelete={() => deleteShape(shape.id)}
    >
      <View style={[styles.card, connectPending && styles.pending]} onLayout={onLayout}>
        <TextInput
          value={shape.text}
          onChangeText={(t) => setShapeText(shape.id, t)}
          multiline
          editable={!connectMode && selected}
          placeholder="なんでも書いてね…"
          placeholderTextColor="rgba(90,77,112,0.4)"
          style={styles.text}
        />
      </View>
    </Transformable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    boxShadow: "0 1px 5px rgba(0,0,0,0.10)",
  },
  pending: {
    borderWidth: 2,
    borderColor: colors.chicLine,
    borderStyle: "dashed",
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
    padding: 0,
    minHeight: 20,
  },
});
