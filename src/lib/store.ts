import { File, Paths } from "expo-file-system";
import { normalizeState } from "./model";
import type { AppState } from "./types";

/**
 * 手帳データはドキュメント領域の1ファイルに保存する。
 * SQLite の1行に入れると、写真(base64)込みで数MBになったとき Android の
 * CursorWindow「row too big」で読めなくなり得るため、行サイズ上限のないファイルにする。
 */
const DOC_NAME = "notebooks-v2.json";
const TMP_NAME = "notebooks-v2.tmp.json";

function docFile(): File {
  return new File(Paths.document, DOC_NAME);
}

function tmpFile(): File {
  return new File(Paths.document, TMP_NAME);
}

export function emptyState(): AppState {
  return { activeNotebookId: null, notebooks: [] };
}

export interface LoadResult {
  state: AppState;
  /** 生データはあるのに壊れて読めなかった（＝退避済み・上書き前に警告すべき） */
  corrupt: boolean;
}

/**
 * 保存済みの手帳データを読む。無ければ空。
 * - ファイルが無い/開けない → 空（storage不調は diagnoseStorage が警告）
 * - 生データはあるが JSON/正規化に失敗 → 生データを退避してから空 + corrupt:true
 *   （次の保存で「唯一の生データ」を無警告に潰さないため）
 */
export function loadState(): LoadResult {
  let raw: string;
  try {
    const dest = docFile();
    const tmp = tmpFile();
    // 本ファイルが無く一時ファイルだけある＝保存が move 直前で中断した場合の保険
    const source = dest.exists ? dest : tmp.exists ? tmp : null;
    if (!source) return { state: emptyState(), corrupt: false };
    raw = source.textSync();
  } catch {
    return { state: emptyState(), corrupt: false };
  }
  try {
    return { state: normalizeState(JSON.parse(raw)), corrupt: false };
  } catch {
    try {
      const backup = new File(Paths.document, `notebooks-v2-broken-${Date.now()}.json`);
      if (!backup.exists) backup.write(raw);
    } catch {
      // 退避に失敗しても致命的ではない（元ファイルはまだ上書きしていない）
    }
    return { state: emptyState(), corrupt: true };
  }
}

/**
 * state をまるごと保存（Web版 flushSave 相当）。
 * まず一時ファイルへ全量書き、成功したものだけを本ファイルへ差し替える（原子的置換）。
 * 書き込み途中で中断しても本ファイル（＝直前の正データ）は壊れない。
 */
export function saveState(state: AppState): void {
  const json = JSON.stringify(state);
  const tmp = tmpFile();
  if (tmp.exists) tmp.delete();
  tmp.write(json);
  const dest = docFile();
  if (dest.exists) dest.delete();
  tmp.move(dest);
}

/** 端末で自動保存が使えるか、書き込み→読み出しで確かめる（Web版 runStorageDiagnosis 相当） */
export function diagnoseStorage(): { ok: boolean; error: string } {
  try {
    const f = new File(Paths.document, "__diag_test__.txt");
    const token = `ok-${Date.now()}`;
    f.write(token);
    const back = f.textSync();
    if (back === token) return { ok: true, error: "" };
    return { ok: false, error: "書き込みはできましたが、読み込んだ内容が一致しませんでした" };
  } catch (e) {
    const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return { ok: false, error: message };
  }
}
