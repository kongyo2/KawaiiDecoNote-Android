import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { PAPER_COLORS, RULE_STYLES } from "@/lib/types";
import type { RuleStyle } from "@/lib/types";

const RULE_LABELS: Record<RuleStyle, string> = {
  lines: "横罫",
  grid: "方眼",
  dot: "ドット",
  blank: "無地",
};

export function NoteControls({
  ruleStyle,
  paperColor,
  onRule,
  onPaper,
}: {
  ruleStyle: RuleStyle;
  paperColor: string;
  onRule: (style: RuleStyle) => void;
  onPaper: (color: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {RULE_STYLES.map((r) => {
          const active = r === ruleStyle;
          return (
            <Pressable key={r} style={[styles.chip, active && styles.chipActive]} onPress={() => onRule(r)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{RULE_LABELS[r]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        {PAPER_COLORS.map((c) => (
          <Pressable
            key={c}
            style={[styles.swatch, { backgroundColor: c }, paperColor === c && styles.swatchActive]}
            onPress={() => onPaper(c)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.white,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.ink,
  },
  chipTextActive: {
    fontFamily: fonts.bodyBold,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: colors.plum,
  },
});
