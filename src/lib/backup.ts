import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { buildBackup, parseBackup } from "./backupFormat";
import type { BackupRejection } from "./backupFormat";
import { readTextFile, writeTextFile } from "./files";
import { fileStamp } from "./format";
import type { AppState } from "./types";

function appVersion(): string {
  return Constants.expoConfig?.version ?? "unknown";
}

export async function exportBackup(state: AppState): Promise<void> {
  const json = JSON.stringify(buildBackup(state, appVersion(), new Date().toISOString()), null, 2);
  const uri = writeTextFile(`kawaii-techo-backup-${fileStamp()}.json`, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "バックアップを保存" });
  }
}

export type ImportResult =
  { status: "picked"; state: AppState } | { status: "canceled" } | { status: "rejected"; reason: BackupRejection };

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
    return { status: "rejected", reason: "notBackup" };
  }
  const decoded = parseBackup(parsed);
  return decoded.ok ? { status: "picked", state: decoded.state } : { status: "rejected", reason: decoded.reason };
}
