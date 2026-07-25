import { Pressable, StyleSheet, Text, View } from "react-native";
import { chic, space, text } from "@/lib/theme";
import { colorLabel, PAPER_COLOR_LABELS, PAPER_COLORS, RULE_STYLES } from "@/lib/types";
import type { RuleStyle } from "@/lib/types";
import { Chip } from "@/components/ui/kit";

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
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="罫線">
        {RULE_STYLES.map((r) => (
          <Chip key={r} label={RULE_LABELS[r]} active={r === ruleStyle} chicMode onPress={() => onRule(r)} />
        ))}
      </View>

      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="用紙の色">
        <Text style={styles.label}>用紙</Text>
        {PAPER_COLORS.map((c) => {
          const selected = paperColor === c;
          return (
            <Pressable
              key={c}
              style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchActive]}
              onPress={() => onPaper(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={colorLabel(PAPER_COLOR_LABELS, c)}
              hitSlop={6}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  label: {
    ...text.micro,
    color: chic.inkSoft,
    marginRight: 2,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: chic.border,
  },
  swatchActive: {
    borderColor: chic.rule,
  },
});
