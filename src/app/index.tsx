import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoverGrid } from "@/components/cover/CoverGrid";
import { CreatePanel } from "@/components/cover/CreatePanel";
import { PromptModal } from "@/components/ui/PromptModal";
import { pickBackup } from "@/lib/backup";
import { notebookDisplayName } from "@/lib/model";
import { colors, fonts } from "@/lib/theme";
import type { NotebookType } from "@/lib/types";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

export default function CoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notebooks = useNotebooks((s) => s.doc.notebooks);
  const storageOk = useNotebooks((s) => s.storageOk);
  const storageError = useNotebooks((s) => s.storageError);
  const createNotebook = useNotebooks((s) => s.createNotebook);
  const deleteNotebook = useNotebooks((s) => s.deleteNotebook);
  const renameNotebook = useNotebooks((s) => s.renameNotebook);
  const recheckStorage = useNotebooks((s) => s.recheckStorage);
  const importState = useNotebooks((s) => s.importState);
  const showToast = useUi((s) => s.showToast);

  const [creating, setCreating] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);

  // href をオブジェクトで渡し、id を [id] パラメータとして安全にエンコードさせる。
  // 取り込んだ手帳IDに / ? # 等が含まれても、文字列補間のように経路が壊れないようにする。
  const open = (id: string) => router.push({ pathname: "/notebook/[id]", params: { id } });

  const onCreate = (type: NotebookType, name: string, color: string) => {
    const id = createNotebook(type, name, color);
    setCreating(false);
    open(id);
  };

  const onDelete = (id: string) => {
    Alert.alert("手帳を削除", "この手帳を削除します。中のページも全部消えます。よろしいですか？", [
      { text: "やめる", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteNotebook(id) },
    ]);
  };

  // 保存データが壊れて空になった/自動保存が使えないときでも、表紙からバックアップを
  // 復元できるようにする（編集画面を開かないと復元できず、壊れた状態を上書きしてしまうのを防ぐ）。
  const onImport = async () => {
    const res = await pickBackup();
    if (res.status === "canceled") return;
    if (res.status === "invalid") {
      showToast("⚠️ 読み込みに失敗しました…ファイルを確認してね");
      return;
    }
    Alert.alert(
      "バックアップを読み込む",
      "現在のすべての手帳を、このバックアップの内容で上書きします。よろしいですか？",
      [
        { text: "やめる", style: "cancel" },
        {
          text: "上書き",
          style: "destructive",
          onPress: () => {
            importState(res.state);
            showToast("バックアップを読み込みました🌸");
          },
        },
      ],
    );
  };

  const renameTarget = notebooks.find((n) => n.id === renameId);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 22 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>かわいくデコれる手帳 🌸✨</Text>
          <Text style={styles.subtitle}>お気に入りの手帳を選んでね</Text>
        </View>

        {!storageOk ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠️ この端末では自動保存が使えないようです。{"\n"}作業が終わったら「💾 書き出し」でバックアップしてね。
            </Text>
            {storageError ? <Text style={styles.warningDetail}>{storageError}</Text> : null}
            <View style={styles.warnActions}>
              <Pressable style={styles.recheck} onPress={recheckStorage}>
                <Text style={styles.recheckText}>🔧 もう一度確認する</Text>
              </Pressable>
              <Pressable style={styles.recheck} onPress={onImport}>
                <Text style={styles.recheckText}>📂 バックアップから復元</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <CoverGrid
          notebooks={notebooks}
          onOpen={open}
          onRename={(id) => setRenameId(id)}
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
        maxLength={30}
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.plum,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    opacity: 0.6,
  },
  warning: {
    backgroundColor: "#fff3e0",
    borderWidth: 1.5,
    borderColor: "#f0b86e",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#7a4a12",
    textAlign: "center",
    lineHeight: 18,
  },
  warningDetail: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: "#7a4a12",
    opacity: 0.8,
    marginTop: 6,
    textAlign: "center",
  },
  warnActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  recheck: {
    borderWidth: 1,
    borderColor: "#d99a4a",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  recheckText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "#7a4a12",
  },
});
