import { Alert } from "react-native";
import { pickBackup } from "@/lib/backup";
import { BACKUP_REJECTION_MESSAGE } from "@/lib/backupFormat";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

// バックアップファイルを選ばせ、確認ダイアログを経て文書全体を置きかえる共通フック。
// 一覧画面・編集画面のどちらからも使う。取り込み完了後に onImported があれば呼ぶ
// （編集画面では一覧へ戻るために使う）。
export function useImportBackup(onImported?: () => void): () => Promise<void> {
  const importState = useNotebooks((s) => s.importState);
  const showToast = useUi((s) => s.showToast);

  return async () => {
    const res = await pickBackup();
    if (res.status === "canceled") return;
    if (res.status === "rejected") {
      showToast(BACKUP_REJECTION_MESSAGE[res.reason]);
      return;
    }
    const count = res.state.notebooks.length;
    Alert.alert(
      "バックアップを読み込む",
      `いまのすべての手帳を、このバックアップの${count}冊で置きかえます。読み込んだあとでも「↩️ 元に戻す」で戻せます。`,
      [
        { text: "やめる", style: "cancel" },
        {
          text: "置きかえる",
          style: "destructive",
          onPress: () => {
            importState(res.state);
            showToast(`バックアップを読み込みました🌸（${count}冊）`);
            onImported?.();
          },
        },
      ],
    );
  };
}
