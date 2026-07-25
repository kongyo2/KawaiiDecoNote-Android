import { describe, expect, it } from "vitest";
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, buildBackup, parseBackup } from "./backupFormat";
import { newNotebook } from "./model";
import type { AppState } from "./types";

function sampleState(): AppState {
  const nb = newNotebook("profile", "テスト帳", "#C9B6E4");
  return { activeNotebookId: nb.id, notebooks: [nb] };
}

describe("buildBackup", () => {
  it("封筒に形式・バージョン・アプリ版・日時を入れる", () => {
    const state = sampleState();
    const file = buildBackup(state, "0.3.0", "2026-07-25T00:00:00.000Z");
    expect(file.format).toBe(BACKUP_FORMAT);
    expect(file.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(file.appVersion).toBe("0.3.0");
    expect(file.exportedAt).toBe("2026-07-25T00:00:00.000Z");
    expect(file.state.notebooks).toHaveLength(1);
  });
});

describe("parseBackup", () => {
  it("自分が書き出した封筒は読める", () => {
    const file = buildBackup(sampleState(), "0.3.0", "2026-07-25T00:00:00.000Z");
    const result = parseBackup(JSON.parse(JSON.stringify(file)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.notebooks[0]?.name).toBe("テスト帳");
  });

  // Web版（index.html）の書き出しは封筒を持たない素の AppState なので、ここで弾かれる。
  it("Web版の素の JSON は「バックアップではない」として弾く", () => {
    const webExport = { activeNotebookId: null, notebooks: [{ id: "nb1", pages: [{ id: "pg1" }] }] };
    expect(parseBackup(webExport)).toEqual({ ok: false, reason: "notBackup" });
  });

  it("オブジェクト以外・配列・null は弾く", () => {
    expect(parseBackup(null).ok).toBe(false);
    expect(parseBackup([]).ok).toBe(false);
    expect(parseBackup("{}").ok).toBe(false);
  });

  it("形式名が違えば弾く", () => {
    expect(parseBackup({ format: "something-else", formatVersion: 1, state: {} })).toEqual({
      ok: false,
      reason: "notBackup",
    });
  });

  it("将来のバージョンは tooNew として弾く", () => {
    const file = buildBackup(sampleState(), "9.9.9", "2026-07-25T00:00:00.000Z");
    expect(parseBackup({ ...file, formatVersion: BACKUP_FORMAT_VERSION + 1 })).toEqual({ ok: false, reason: "tooNew" });
  });

  it("バージョンが数値でなければ tooNew として弾く", () => {
    const file = buildBackup(sampleState(), "0.3.0", "2026-07-25T00:00:00.000Z");
    expect(parseBackup({ ...file, formatVersion: "1" })).toEqual({ ok: false, reason: "tooNew" });
  });

  it("手帳が1冊も無ければ empty", () => {
    const file = buildBackup({ activeNotebookId: null, notebooks: [] }, "0.3.0", "2026-07-25T00:00:00.000Z");
    expect(parseBackup(file)).toEqual({ ok: false, reason: "empty" });
  });

  it("中身は normalizeState を通すので壊れた値も直る", () => {
    const result = parseBackup({
      format: BACKUP_FORMAT,
      formatVersion: 1,
      state: {
        activeNotebookId: "missing",
        notebooks: [{ id: "nb1", type: "bogus", pages: [{ id: "pg1", frame: "bogus" }] }],
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.activeNotebookId).toBeNull();
      expect(result.state.notebooks[0]?.type).toBe("profile");
      expect(result.state.notebooks[0]?.pages[0]?.frame).toBe("aurora");
    }
  });
});
