import { Alert } from "react-native";
import { pickBackup } from "@/lib/backup";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

// バックアップファイルを選ばせ、確認ダイアログを経て文書全体を上書き取り込みする共通フック。
// 一覧画面・編集画面のどちらからも使う。取り込み完了後に onImported があれば呼ぶ
// （編集画面では一覧へ戻るために使う）。
export function useImportBackup(onImported?: () => void): () => Promise<void> {
  const importState = useNotebooks((s) => s.importState);
  const showToast = useUi((s) => s.showToast);

  return async () => {
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
            onImported?.();
          },
        },
      ],
    );
  };
}
