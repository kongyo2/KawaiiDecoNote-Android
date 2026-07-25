import { normalizeState } from "./model";
import type { AppState } from "./types";

// バックアップファイルの中身の型。0.3.0 で「素の AppState をそのまま JSON に
// する」形をやめ、封筒（format / formatVersion）で包む形にした。
//
// これにより Web版（index.html）が書き出す JSON — 封筒のない
// { activeNotebookId, notebooks } — は読み込めなくなる。Android版は独自の
// 保存形式として歩むことにしたので、Web版との相互読み込みは意図的に打ち切っている。
export const BACKUP_FORMAT = "kawaii-deconote-android";
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupEnvelope {
  format: string;
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  state: AppState;
}

export function buildBackup(state: AppState, appVersion: string, exportedAt: string): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    exportedAt,
    state,
  };
}

export type BackupRejection = "notBackup" | "tooNew" | "empty";

export type BackupParseResult = { ok: true; state: AppState } | { ok: false; reason: BackupRejection };

// 読み込んだ JSON をバックアップとして解釈する。封筒が違えば読まずに弾く。
export function parseBackup(raw: unknown): BackupParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, reason: "notBackup" };
  const envelope = raw as Partial<BackupEnvelope>;
  if (envelope.format !== BACKUP_FORMAT) return { ok: false, reason: "notBackup" };
  if (typeof envelope.formatVersion !== "number" || envelope.formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, reason: "tooNew" };
  }
  const state = normalizeState(envelope.state);
  if (state.notebooks.length === 0) return { ok: false, reason: "empty" };
  return { ok: true, state };
}

export const BACKUP_REJECTION_MESSAGE: Record<BackupRejection, string> = {
  notBackup: "⚠️ このファイルは「かわいくデコれる手帳」のバックアップではないみたい",
  tooNew: "⚠️ 新しいバージョンのバックアップです。アプリを更新してね",
  empty: "⚠️ 手帳が1冊も入っていないバックアップでした",
};
