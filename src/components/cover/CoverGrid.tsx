import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { notebookDisplayName } from "@/lib/model";
import type { Notebook } from "@/lib/types";

export function CoverGrid({
  notebooks,
  onOpen,
  onRename,
  onDelete,
  onAdd,
}: {
  notebooks: Notebook[];
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.grid}>
      {notebooks.map((nb) => (
        <Pressable key={nb.id} style={styles.cell} onPress={() => onOpen(nb.id)}>
          <View style={[styles.card, { backgroundColor: nb.color }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{nb.type === "notestyle" ? "📓" : "📔"}</Text>
            </View>
            <Pressable style={[styles.corner, styles.edit]} onPress={() => onRename(nb.id)} hitSlop={6}>
              <Text style={styles.cornerText}>✏️</Text>
            </Pressable>
            <Pressable style={[styles.corner, styles.del]} onPress={() => onDelete(nb.id)} hitSlop={6}>
              <Text style={styles.cornerText}>✕</Text>
            </Pressable>
            <Text style={styles.name} numberOfLines={3}>
              {notebookDisplayName(nb)}
            </Text>
          </View>
        </Pressable>
      ))}

      <Pressable style={styles.cell} onPress={onAdd}>
        <View style={styles.addCard}>
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addLabel}>新しい手帳</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cell: {
    width: "47%",
    flexGrow: 1,
    aspectRatio: 3 / 4,
  },
  card: {
    flex: 1,
    borderRadius: radii.card,
    padding: 14,
    justifyContent: "flex-end",
    boxShadow: "0 4px 14px rgba(90,70,110,0.18)",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 16,
  },
  corner: {
    position: "absolute",
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  edit: {
    right: 36,
  },
  del: {
    right: 8,
  },
  cornerText: {
    fontSize: 11,
    color: colors.plum,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.white,
  },
  addCard: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: "rgba(155,130,180,0.5)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addPlus: {
    fontSize: 24,
    color: "#9b7fb8",
  },
  addLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#9b7fb8",
  },
});
