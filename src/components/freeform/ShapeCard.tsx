import { useEffect, useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { chic, colors, radii, shadows, space, text } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import { SHAPE_MAX_WIDTH, SHAPE_MIN_WIDTH } from "@/lib/types";
import type { Shape } from "@/lib/types";
import { GRIP_RESERVE, Transformable } from "@/components/transform/Transformable";
import type { TransformPatch } from "@/components/transform/Transformable";

export function ShapeCard({
  shape,
  selected,
  connectMode,
  connectPending,
  onSelect,
  onConnectTap,
  onMeasureHeight,
  boundsWidth,
}: {
  shape: Shape;
  selected: boolean;
  connectMode: boolean;
  connectPending: boolean;
  onSelect: () => void;
  onConnectTap: (id: string) => void;
  onMeasureHeight: (id: string, height: number) => void;
  boundsWidth?: number | undefined;
}) {
  const setShapeText = useNotebooks((s) => s.setShapeText);
  const updateShape = useNotebooks((s) => s.updateShape);
  const deleteShape = useNotebooks((s) => s.deleteShape);
  const focusId = useUi((s) => s.focusId);
  const setFocus = useUi((s) => s.setFocus);
  const inputRef = useRef<TextInput>(null);

  // 「＋テキスト」で置いたばかりのカードは、選択され次第そのまま書き始められるようにする。
  // 入力欄は選択中しか editable にならないので、選択が乗るのを待ってから focus する。
  useEffect(() => {
    if (focusId !== shape.id || !selected) return;
    setFocus(null);
    inputRef.current?.focus();
  }, [focusId, shape.id, selected, setFocus]);

  const onChange = (patch: TransformPatch) => updateShape(shape.id, patch);
  const onLayout = (e: LayoutChangeEvent) => onMeasureHeight(shape.id, e.nativeEvent.layout.height);
  const preview = shape.text.trim().slice(0, 20);

  return (
    <Transformable
      x={shape.x}
      y={shape.y}
      w={shape.w}
      rot={shape.rot}
      minW={SHAPE_MIN_WIDTH}
      maxW={SHAPE_MAX_WIDTH}
      selected={connectMode ? false : selected}
      bodyDraggable={false}
      showDragHandle={!connectMode}
      handleTint={chic.handle}
      boundsWidth={boundsWidth}
      minY={GRIP_RESERVE}
      label={preview ? `テキスト「${preview}」` : "空のテキスト"}
      // 中に編集できる入力欄があるので、ひとかたまりの読み上げ要素にはまとめない。
      bodyAccessible={false}
      deleteLabel="このテキストを消す"
      onSelect={() => (connectMode ? onConnectTap(shape.id) : onSelect())}
      onChange={onChange}
      onDelete={() => deleteShape(shape.id)}
    >
      <View style={[styles.card, connectPending && styles.pending]} onLayout={onLayout}>
        <TextInput
          ref={inputRef}
          value={shape.text}
          onChangeText={(t) => setShapeText(shape.id, t)}
          multiline
          editable={!connectMode && selected}
          placeholder="なんでも書いてね…"
          placeholderTextColor={colors.placeholder}
          cursorColor={chic.ink}
          style={styles.text}
        />
      </View>
    </Transformable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chic.card,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: chic.borderSoft,
    padding: space.sm,
    boxShadow: shadows.chicCard,
  },
  pending: {
    borderWidth: 2,
    borderColor: chic.rule,
    borderStyle: "dashed",
  },
  text: {
    ...text.body,
    color: colors.ink,
    padding: 0,
    minHeight: 20,
  },
});
