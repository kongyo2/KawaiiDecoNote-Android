import { File, Paths } from "expo-file-system";
import { normalizeState } from "./model";
import type { AppState } from "./types";

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
  corrupt: boolean;
}

export function loadState(): LoadResult {
  let raw: string;
  try {
    const dest = docFile();
    const tmp = tmpFile();
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
    } catch {}
    return { state: emptyState(), corrupt: true };
  }
}

export function saveState(state: AppState): void {
  const json = JSON.stringify(state);
  const tmp = tmpFile();
  if (tmp.exists) tmp.delete();
  tmp.write(json);
  const dest = docFile();
  if (dest.exists) dest.delete();
  tmp.move(dest);
}

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
