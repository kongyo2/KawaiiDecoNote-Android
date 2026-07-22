import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { writeTextFile, readTextFile } from "./files";
import { todayStamp } from "./format";
import { normalizeState } from "./model";
import type { AppState } from "./types";

export async function exportBackup(state: AppState): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  const uri = writeTextFile(`kawaii-techo-backup-${todayStamp()}.json`, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "バックアップを保存" });
  }
}

export type ImportResult = { status: "picked"; state: AppState } | { status: "canceled" } | { status: "invalid" };

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
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { notebooks?: unknown }).notebooks)) {
    return { status: "invalid" };
  }
  const state = normalizeState(parsed);
  if (state.notebooks.length === 0) return { status: "invalid" };
  return { status: "picked", state };
}
