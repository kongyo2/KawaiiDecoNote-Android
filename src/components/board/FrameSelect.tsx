import { StyleSheet, View } from "react-native";
import { space } from "@/lib/theme";
import { FRAMES } from "@/lib/types";
import type { Frame } from "@/lib/types";
import { Chip } from "@/components/ui/kit";

const LABELS: Record<Frame, string> = {
  plain: "🕊️ シンプル",
  aurora: "🌌 オーロラ滲み",
  star: "⭐ 星屑ちらし",
  ribbon: "🎀 リボン留め",
};

export function FrameSelect({ frame, onSelect }: { frame: Frame; onSelect: (f: Frame) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="飾り枠">
      {FRAMES.map((f) => (
        <Chip key={f} label={LABELS[f]} active={f === frame} onPress={() => onSelect(f)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.md,
    marginBottom: space.xs,
    paddingHorizontal: space.md,
  },
});
