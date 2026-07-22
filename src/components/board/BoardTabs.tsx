import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { pageDisplayTitle } from "@/lib/model";
import type { Notebook, PageType } from "@/lib/types";

export function BoardTabs({
  notebook,
  onSelect,
  onDelete,
  onAddPage,
}: {
  notebook: Notebook;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPage: (type: PageType) => void;
}) {
  const isNoteStyle = notebook.type === "notestyle";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {notebook.pages.map((p) => {
        const active = p.id === notebook.activePageId;
        const icon = isNoteStyle ? "📄" : p.type === "notebook" ? "📖" : "📋";
        return (
          <Pressable key={p.id} style={[styles.tab, active && styles.tabActive]} onPress={() => onSelect(p.id)}>
            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
              {icon} {pageDisplayTitle(p)}
            </Text>
            {active ? (
              <Pressable style={styles.tabDel} onPress={() => onDelete(p.id)} hitSlop={8}>
                <Text style={styles.tabDelText}>✕</Text>
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}

      {isNoteStyle ? (
        <Pressable style={styles.addTab} onPress={() => onAddPage("flowchart")}>
          <Text style={styles.addText}>＋ ページを追加</Text>
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.addTab} onPress={() => onAddPage("flowchart")}>
            <Text style={styles.addText}>＋📋 工程</Text>
          </Pressable>
          <Pressable style={styles.addTab} onPress={() => onAddPage("notebook")}>
            <Text style={styles.addText}>＋📖 自由帳</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 10,
    alignItems: "center",
  },
  tab: {
    maxWidth: 170,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.white,
    borderColor: colors.lavender,
    boxShadow: "0 2px 8px rgba(155,130,180,0.2)",
  },
  tabText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
  },
  tabTextActive: {
    fontFamily: fonts.bodyBold,
  },
  tabDel: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
  },
  tabDelText: {
    color: colors.white,
    fontSize: 10,
    lineHeight: 12,
  },
  addTab: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(155,130,180,0.5)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  addText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: "#9b7fb8",
  },
});
