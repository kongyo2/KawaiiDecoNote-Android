import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoverGrid } from "@/components/cover/CoverGrid";
import { CreatePanel } from "@/components/cover/CreatePanel";
import { PromptModal } from "@/components/ui/PromptModal";
import { tapFeedback } from "@/lib/haptics";
import { notebookDisplayName } from "@/lib/model";
import { colors, radii, space, text } from "@/lib/theme";
import { MAX_NOTEBOOK_NAME } from "@/lib/types";
import type { NotebookType } from "@/lib/types";
import { useImportBackup } from "@/state/backup";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

export default function CoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notebooks = useNotebooks((s) => s.doc.notebooks);
  const storageOk = useNotebooks((s) => s.storageOk);
  const storageError = useNotebooks((s) => s.storageError);
  const canUndo = useNotebooks((s) => s.canUndo);
  const createNotebook = useNotebooks((s) => s.createNotebook);
  const duplicateNotebook = useNotebooks((s) => s.duplicateNotebook);
  const deleteNotebook = useNotebooks((s) => s.deleteNotebook);
  const renameNotebook = useNotebooks((s) => s.renameNotebook);
  const recheckStorage = useNotebooks((s) => s.recheckStorage);
  const showToast = useUi((s) => s.showToast);

  const [creating, setCreating] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);

  // 画面を出す前に「開いている手帳」を確定させる。編集画面の初回描画で
  // 一瞬「手帳が見つかりませんでした」が出るのを防ぐため。
  const open = (id: string) => {
    useNotebooks.getState().openNotebook(id);
    router.push({ pathname: "/notebook/[id]", params: { id } });
  };

  const onCreate = (type: NotebookType, name: string, color: string) => {
    const id = createNotebook(type, name, color);
    setCreating(false);
    open(id);
  };

  const onDuplicate = (id: string) => {
    if (duplicateNotebook(id) === null) return;
    tapFeedback();
    showToast("手帳をコピーしたよ📔✨");
  };

  const onDelete = (id: string) => {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb) return;
    Alert.alert(
      "手帳を削除",
      `「${notebookDisplayName(nb)}」と中の${nb.pages.length}ページを削除します。消したあとでも「元に戻す」で戻せます。`,
      [
        { text: "やめる", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            deleteNotebook(id);
            showToast("手帳を削除しました。元に戻せます🗑️");
          },
        },
      ],
    );
  };

  const onUndo = () => {
    const ok = useNotebooks.getState().undo();
    showToast(ok ? "↩️ ひとつ前に戻しました" : "⚠️ まだ保存中で戻せません…もう一度どうぞ");
  };

  const onImport = useImportBackup();

  const renameTarget = notebooks.find((n) => n.id === renameId);
  const subtitle = notebooks.length === 0 ? "まずは1冊、表紙から選んでつくろう" : `${notebooks.length}冊の手帳`;

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>かわいくデコれる手帳 🌸✨</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {!storageOk ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠️ この端末では自動保存が使えないようです。{"\n"}作業が終わったら「💾 書き出し」でバックアップしてね。
            </Text>
            {storageError ? <Text style={styles.warningDetail}>{storageError}</Text> : null}
            <View style={styles.warnActions}>
              <Pressable style={styles.recheck} onPress={recheckStorage} accessibilityRole="button">
                <Text style={styles.recheckText}>🔧 もう一度確認する</Text>
              </Pressable>
              <Pressable style={styles.recheck} onPress={onImport} accessibilityRole="button">
                <Text style={styles.recheckText}>📂 バックアップから復元</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* 一覧側でも削除・コピーを取り消せるようにしておく（編集画面のツールバーは
            ここからは届かないため） */}
        {canUndo ? (
          <Pressable
            style={({ pressed }) => [styles.undo, pressed && styles.undoPressed]}
            onPress={onUndo}
            accessibilityRole="button"
            accessibilityLabel="ひとつ前に戻す"
          >
            <Text style={styles.undoText}>↩️ さっきの操作を元に戻す</Text>
          </Pressable>
        ) : null}

        <CoverGrid
          notebooks={notebooks}
          onOpen={open}
          onRename={(id) => setRenameId(id)}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAdd={() => setCreating(true)}
        />

        {creating ? <CreatePanel onCreate={onCreate} onCancel={() => setCreating(false)} /> : null}
      </ScrollView>

      <PromptModal
        visible={renameTarget !== undefined}
        title="手帳の名前を入力してね📔"
        initialValue={renameTarget ? notebookDisplayName(renameTarget) : ""}
        placeholder="手帳のなまえ"
        maxLength={MAX_NOTEBOOK_NAME}
        onCancel={() => setRenameId(null)}
        onSubmit={(name) => {
          if (renameId) renameNotebook(renameId, name);
          setRenameId(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: 40,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: space.lg,
  },
  title: {
    ...text.displayL,
    color: colors.plum,
    marginBottom: space.xs,
    textAlign: "center",
  },
  subtitle: {
    ...text.label,
    color: colors.ink,
    opacity: 0.6,
  },
  warning: {
    backgroundColor: colors.warnBg,
    borderWidth: 1.5,
    borderColor: colors.warnBorder,
    borderRadius: 14,
    padding: space.md,
    marginBottom: space.md,
  },
  warningText: {
    ...text.label,
    color: colors.warnInk,
    textAlign: "center",
  },
  warningDetail: {
    ...text.micro,
    color: colors.warnInk,
    opacity: 0.8,
    marginTop: 6,
    textAlign: "center",
  },
  warnActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.sm,
  },
  recheck: {
    borderWidth: 1,
    borderColor: "#D99A4A",
    borderRadius: radii.small,
    paddingVertical: 5,
    paddingHorizontal: space.md,
  },
  recheckText: {
    ...text.caption,
    color: colors.warnInk,
  },
  undo: {
    alignSelf: "center",
    marginBottom: space.md,
    paddingVertical: 7,
    paddingHorizontal: space.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.veilStrong,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  undoPressed: {
    opacity: 0.75,
  },
  undoText: {
    ...text.caption,
    color: colors.plum,
  },
});
