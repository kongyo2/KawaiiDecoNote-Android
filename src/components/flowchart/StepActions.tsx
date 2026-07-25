import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, space } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";

// 工程カード／if分岐カードの右肩に並ぶ「▲ ▼ ✕」。並びの中で1つしかないときは
// 矢印を出さない（押せないボタンを置かない）。
export function StepActions({
  stepId,
  isFirst,
  isLast,
  onDelete,
  deleteLabel = "この工程を削除",
  compact = false,
}: {
  stepId: string;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  deleteLabel?: string;
  compact?: boolean;
}) {
  const moveStep = useNotebooks((s) => s.moveStep);
  const movable = !(isFirst && isLast);

  return (
    <View style={styles.actions}>
      {movable ? (
        <>
          <Pressable
            onPress={() => moveStep(stepId, -1)}
            disabled={isFirst}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ひとつ上へ"
            accessibilityState={{ disabled: isFirst }}
          >
            <Text style={[styles.icon, compact && styles.iconCompact, isFirst && styles.iconHidden]}>▲</Text>
          </Pressable>
          <Pressable
            onPress={() => moveStep(stepId, 1)}
            disabled={isLast}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ひとつ下へ"
            accessibilityState={{ disabled: isLast }}
          >
            <Text style={[styles.icon, compact && styles.iconCompact, isLast && styles.iconHidden]}>▼</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel={deleteLabel}>
        <Text style={[styles.icon, compact && styles.iconCompact]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    gap: space.xs / 2,
  },
  icon: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.inkSoft,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  iconCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  iconHidden: {
    opacity: 0,
  },
});
