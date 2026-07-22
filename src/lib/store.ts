import { kvGet, kvSet } from "./db";
import { normalizeState } from "./model";
import type { AppState } from "./types";

/** Web版の localStorage/IndexedDB キー名をそのまま踏襲 */
const STORAGE_KEY = "notebooks-v2";

/**
 * 保存済みの手帳データを読む。無ければ空。
 * DBのオープン/読み取り失敗も、壊れたJSONも、すべて空stateにフォールバックして
 * 起動時にクラッシュさせない（保存不可の警告は diagnoseStorage 側で出す）。
 */
export function loadState(): AppState {
  try {
    const raw = kvGet(STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

/** state をまるごと保存（Web版 flushSave 相当） */
export function saveState(state: AppState): void {
  kvSet(STORAGE_KEY, JSON.stringify(state));
}

export function emptyState(): AppState {
  return { activeNotebookId: null, notebooks: [] };
}

/** 端末で自動保存が使えるか、書き込み→読み出しで確かめる（Web版 runStorageDiagnosis 相当） */
export function diagnoseStorage(): { ok: boolean; error: string } {
  try {
    const token = `ok-${Date.now()}`;
    kvSet("__diag_test__", token);
    const back = kvGet("__diag_test__");
    if (back === token) return { ok: true, error: "" };
    return { ok: false, error: "書き込みはできましたが、読み込んだ内容が一致しませんでした" };
  } catch (e) {
    const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return { ok: false, error: message };
  }
}
