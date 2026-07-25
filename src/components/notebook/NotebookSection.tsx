import { StyleSheet, TextInput, View } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { colors, text } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { Page } from "@/lib/types";
import { useSvgId } from "@/components/ui/Gradient";

const LINE_HEIGHT = 32;
const MIN_HEIGHT = 280;

export function NotebookSection({ page }: { page: Page }) {
  const setNote = useNotebooks((s) => s.setNote);
  const rule = useSvgId("noteRule");

  return (
    <View style={styles.wrap}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={rule} width={LINE_HEIGHT} height={LINE_HEIGHT} patternUnits="userSpaceOnUse">
            <Line
              x1="0"
              y1={LINE_HEIGHT - 0.5}
              x2={LINE_HEIGHT}
              y2={LINE_HEIGHT - 0.5}
              stroke="rgba(155,130,180,0.18)"
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${rule})`} />
      </Svg>
      <TextInput
        value={page.note}
        onChangeText={setNote}
        multiline
        placeholder="今日思ったこと、なんでも書いてね…"
        placeholderTextColor={colors.placeholder}
        accessibilityLabel="自由帳の本文"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: MIN_HEIGHT,
  },
  input: {
    minHeight: MIN_HEIGHT,
    ...text.bodyL,
    lineHeight: LINE_HEIGHT,
    color: colors.ink,
    paddingHorizontal: 4,
    paddingTop: 2,
    textAlignVertical: "top",
  },
});
