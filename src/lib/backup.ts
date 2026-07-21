import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { writeTextFile, readTextFile } from "./files";
import { todayStamp } from "./format";
import { normalizeState } from "./model";
import type { AppState } from "./types";

/**
 * バックアップは Web版（pppzet/KawaiiDecoNote index.html）の書き出しと同じ形。
 * Web版が state をそのまま JSON.stringify したものなので、
 * このアプリと Web版でバックアップを相互に読み込める。写真は data URL 埋め込み。
 */

export async function exportBackup(state: AppState): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  const uri = writeTextFile(`kawaii-techo-backup-${todayStamp()}.json`, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "バックアップを保存" });
  }
}

export type ImportResult = { status: "picked"; state: AppState } | { status: "canceled" } | { status: "invalid" };

/** ファイルを選んで検証し、正規化した state を返す（置き換え確認は呼び出し側で） */
export async function pickBackup(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "application/octet-stream", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { status: "canceled" };
  const asset = result.assets[0];
  if (!asset) return { status: "canceled" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readTextFile(asset.uri));
  } catch {
    return { status: "invalid" };
  }
  // notebooks 配列を持つJSONだけ受け付ける（壊れたファイルで既存データを消さないため）
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { notebooks?: unknown }).notebooks)) {
    return { status: "invalid" };
  }
  const state = normalizeState(parsed);
  if (state.notebooks.length === 0) return { status: "invalid" };
  return { status: "picked", state };
}
