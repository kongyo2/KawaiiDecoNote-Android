import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { pageDisplayTitle } from "@/lib/model";
import { chic as chicTheme, colors, radii, shadows, space, text } from "@/lib/theme";
import type { Notebook, Page, PageType } from "@/lib/types";
import { IconButton } from "@/components/ui/kit";

function tabIcon(notebook: Notebook, page: Page): string {
  if (notebook.type === "notestyle") return "📄";
  return page.type === "notebook" ? "📖" : "📋";
}

export function BoardTabs({
  notebook,
  onSelect,
  onDuplicate,
  onDelete,
  onAddPage,
}: {
  notebook: Notebook;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
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
        const title = pageDisplayTitle(p);
        return (
          <Pressable
            key={p.id}
            style={[
              styles.tab,
              isNoteStyle ? styles.tabChic : null,
              active ? (isNoteStyle ? styles.tabChicActive : styles.tabActive) : null,
            ]}
            onPress={() => onSelect(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${title}のページ`}
          >
            {/* 見出しインデックスの「つまみ」。開いているページだけ色が乗る */}
            {active && !isNoteStyle ? (
              <View style={[styles.tabMark, { backgroundColor: notebook.color }]} pointerEvents="none" />
            ) : null}

            <Text
              style={[
                styles.tabText,
                isNoteStyle ? styles.tabTextChic : null,
                active ? styles.tabTextActive : null,
                active && isNoteStyle ? styles.tabTextChicActive : null,
              ]}
              numberOfLines={1}
            >
              {tabIcon(notebook, p)} {title}
            </Text>

            {active ? (
              <View style={styles.tabActions}>
                <IconButton
                  icon="📄"
                  label={`${title}をコピー`}
                  size={22}
                  tone="plain"
                  onPress={() => onDuplicate(p.id)}
                />
                <IconButton
                  icon="✕"
                  label={`${title}を削除`}
                  size={22}
                  tone={isNoteStyle ? "plain" : "rose"}
                  {...(isNoteStyle ? { tint: chicTheme.inkSoft } : {})}
                  onPress={() => onDelete(p.id)}
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}

      {isNoteStyle ? (
        <Pressable
          style={[styles.addTab, styles.addTabChic]}
          onPress={() => onAddPage("flowchart")}
          accessibilityRole="button"
        >
          <Text style={[styles.addText, styles.addTextChic]}>＋ ページを追加</Text>
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.addTab} onPress={() => onAddPage("flowchart")} accessibilityRole="button">
            <Text style={styles.addText}>＋📋 工程</Text>
          </Pressable>
          <Pressable style={styles.addTab} onPress={() => onAddPage("notebook")} accessibilityRole="button">
            <Text style={styles.addText}>＋📖 自由帳</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space.sm,
    paddingHorizontal: space.xs,
    paddingTop: space.md,
    paddingBottom: space.xs,
    alignItems: "flex-end",
  },
  tab: {
    maxWidth: 230,
    minHeight: 34,
    paddingVertical: 7,
    paddingLeft: space.md,
    paddingRight: space.md,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.veilWeak,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  tabActive: {
    backgroundColor: colors.white,
    borderColor: colors.lavender,
    paddingTop: 10,
    boxShadow: shadows.chip,
  },
  // 開いているページの上端に走る色帯＝インデックスのつまみ。
  tabMark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  tabChic: {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingHorizontal: space.sm,
  },
  tabChicActive: {
    borderBottomColor: chicTheme.rule,
  },
  tabText: {
    ...text.label,
    color: colors.ink,
    flexShrink: 1,
  },
  tabTextActive: {
    ...text.labelBold,
    color: colors.ink,
  },
  tabTextChic: {
    color: chicTheme.inkSoft,
  },
  tabTextChicActive: {
    color: "#222222",
  },
  tabActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: space.xs,
  },
  addTab: {
    minHeight: 34,
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.dashedStrong,
    borderStyle: "dashed",
    backgroundColor: colors.veilWeak,
  },
  addTabChic: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: chicTheme.card,
    borderRadius: radii.tiny,
  },
  addText: {
    ...text.labelBold,
    color: colors.lavenderDeep,
  },
  addTextChic: {
    color: chicTheme.inkSoft,
  },
});
