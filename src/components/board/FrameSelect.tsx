import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { FRAMES } from "@/lib/types";
import type { Frame } from "@/lib/types";

const LABELS: Record<Frame, string> = {
  plain: "🕊️ シンプル",
  aurora: "🌌 オーロラ滲み",
  star: "⭐ 星屑ちらし",
  ribbon: "🎀 リボン留め",
};

export function FrameSelect({ frame, onSelect }: { frame: Frame; onSelect: (f: Frame) => void }) {
  return (
    <View style={styles.row}>
      {FRAMES.map((f) => {
        const active = f === frame;
        return (
          <Pressable key={f} style={[styles.chip, active && styles.chipActive]} onPress={() => onSelect(f)}>
            <Text style={[styles.text, active && styles.textActive]}>{LABELS[f]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.panel,
  },
  chipActive: {
    backgroundColor: colors.white,
    borderColor: colors.lavender,
    boxShadow: "0 2px 8px rgba(155,130,180,0.25)",
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
  },
  textActive: {
    fontFamily: fonts.bodyBold,
  },
});
