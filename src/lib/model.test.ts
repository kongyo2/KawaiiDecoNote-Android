import { describe, expect, it } from "vitest";
import {
  appendToBranch,
  copyName,
  duplicateNotebook,
  duplicatePage,
  moveStepInTree,
  newId,
  newIfStep,
  newNotebook,
  newPage,
  newStep,
  normalizeNotebook,
  normalizePage,
  normalizeState,
  notebookDisplayName,
  pageDisplayTitle,
  removeStepFromTree,
  seedUid,
  stepProgress,
  updateStepInTree,
} from "./model";
import type { IfStep, NormalStep, Notebook, Page, Step } from "./types";

// --- テスト用の工程ツリー・ビルダー ---
const plain = (id: string, text = "", done = false): NormalStep => ({ id, type: "step", text, done });
const ifStep = (id: string, yes: Step[] = [], no: Step[] = []): IfStep => ({
  id,
  type: "if",
  text: "",
  done: false,
  labels: { yes: "はい", no: "いいえ" },
  branches: { yes, no },
});

const idNum = (id: string): number => parseInt(id.replace(/^id(\d+)_.*/, "$1"), 10);

describe("factories", () => {
  it("newStep は空の工程を作る", () => {
    const s = newStep();
    expect(s.type).toBe("step");
    expect(s.text).toBe("");
    expect(s.done).toBe(false);
    expect(s.id).toBeTruthy();
  });

  it("newIfStep は空の分岐と既定ラベルを持つ", () => {
    const s = newIfStep();
    expect(s.type).toBe("if");
    expect(s.labels).toEqual({ yes: "はい", no: "いいえ" });
    expect(s.branches).toEqual({ yes: [], no: [] });
  });

  it("newPage は既定値を持つフローチャートページ", () => {
    const p = newPage();
    expect(p.type).toBe("flowchart");
    expect(p.frame).toBe("aurora");
    expect(p.steps).toEqual([]);
    expect(p.stickers).toEqual([]);
    expect(p.ruleStyle).toBe("lines");
  });

  it("newNotebook は1ページを持ち activePageId が一致する", () => {
    const nb = newNotebook("notestyle", "ノート", "#A8E6CF");
    expect(nb.pages).toHaveLength(1);
    expect(nb.activePageId).toBe(nb.pages[0]?.id);
    expect(nb.type).toBe("notestyle");
    expect(nb.name).toBe("ノート");
  });

  it("newId は毎回ユニーク", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
  });
});

describe("seedUid", () => {
  it("ネストした工程まで走査して最大番号の次から採番する", () => {
    seedUid({
      activeNotebookId: null,
      notebooks: [
        {
          id: "id10_a",
          name: "",
          type: "profile",
          color: "#C9B6E4",
          activePageId: "id20_b",
          pages: [
            {
              ...newPage(),
              id: "id20_b",
              steps: [ifStep("id30_c", [plain("id900_deep")], [])],
            },
          ],
        },
      ],
    });
    // ネストの id900 を拾えていれば、次の採番は 901。
    expect(idNum(newId())).toBe(901);
  });
});

describe("updateStepInTree", () => {
  it("トップレベルの工程を更新する", () => {
    const tree: Step[] = [plain("a", "old"), plain("b")];
    const out = updateStepInTree(tree, "a", (s) => ({ ...s, text: "new" }));
    expect((out[0] as NormalStep).text).toBe("new");
    expect((out[1] as NormalStep).text).toBe("");
  });

  it("分岐の中（ネスト）の工程を更新する", () => {
    const tree: Step[] = [ifStep("if1", [plain("y1", "old")], [plain("n1")])];
    const out = updateStepInTree(tree, "y1", (s) => ({ ...s, text: "changed" }));
    const branchYes = (out[0] as IfStep).branches.yes[0] as NormalStep;
    expect(branchYes.text).toBe("changed");
  });

  it("2段以上深いネストも更新する", () => {
    const tree: Step[] = [ifStep("if1", [ifStep("if2", [plain("deep", "old")])])];
    const out = updateStepInTree(tree, "deep", (s) => ({ ...s, text: "deepnew" }));
    const deep = ((out[0] as IfStep).branches.yes[0] as IfStep).branches.yes[0] as NormalStep;
    expect(deep.text).toBe("deepnew");
  });

  it("元の配列・オブジェクトを破壊しない", () => {
    const original = plain("a", "keep");
    const tree: Step[] = [original];
    const out = updateStepInTree(tree, "a", (s) => ({ ...s, text: "new" }));
    expect(original.text).toBe("keep");
    expect(out).not.toBe(tree);
  });

  it("該当 id が無ければ内容は変わらない", () => {
    const tree: Step[] = [plain("a", "x")];
    const out = updateStepInTree(tree, "zzz", (s) => ({ ...s, text: "!" }));
    expect((out[0] as NormalStep).text).toBe("x");
  });
});

describe("removeStepFromTree", () => {
  it("トップレベルの工程を削除する", () => {
    const tree: Step[] = [plain("a"), plain("b"), plain("c")];
    const out = removeStepFromTree(tree, "b");
    expect(out.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("分岐の中の工程を削除し、兄弟は残す", () => {
    const tree: Step[] = [ifStep("if1", [plain("y1"), plain("y2")], [plain("n1")])];
    const out = removeStepFromTree(tree, "y1");
    const top = out[0] as IfStep;
    expect(top.branches.yes.map((s) => s.id)).toEqual(["y2"]);
    expect(top.branches.no.map((s) => s.id)).toEqual(["n1"]);
  });

  it("ネストした if カードを丸ごと削除する（子ごと消える）", () => {
    const tree: Step[] = [ifStep("if1", [ifStep("if2", [plain("deep")])], [])];
    const out = removeStepFromTree(tree, "if2");
    expect((out[0] as IfStep).branches.yes).toHaveLength(0);
    expect(JSON.stringify(out)).not.toContain("deep");
  });
});

describe("appendToBranch", () => {
  it("トップの if の yes / no に追加する", () => {
    const tree: Step[] = [ifStep("if1")];
    const withYes = appendToBranch(tree, "if1", "yes", plain("y1"));
    expect((withYes[0] as IfStep).branches.yes.map((s) => s.id)).toEqual(["y1"]);
    const withNo = appendToBranch(withYes, "if1", "no", newIfStep());
    expect((withNo[0] as IfStep).branches.no[0]?.type).toBe("if");
  });

  it("ネストした if の分岐にも追加できる", () => {
    const tree: Step[] = [ifStep("if1", [ifStep("if2")], [])];
    const out = appendToBranch(tree, "if2", "yes", plain("newDeep"));
    const nested = (out[0] as IfStep).branches.yes[0] as IfStep;
    expect(nested.branches.yes.map((s) => s.id)).toEqual(["newDeep"]);
  });

  it("存在しない id には何もしない", () => {
    const tree: Step[] = [ifStep("if1")];
    const out = appendToBranch(tree, "zzz", "yes", plain("x"));
    expect((out[0] as IfStep).branches.yes).toHaveLength(0);
  });

  it("対象が if でなければ（工程カードの id）追加しない", () => {
    const tree: Step[] = [plain("a")];
    const out = appendToBranch(tree, "a", "yes", plain("x"));
    expect(out[0]).toEqual(plain("a"));
  });
});

describe("normalizeState（ネスト対応の取り込み）", () => {
  it("旧フォーマットの分岐工程（type なし）を type:'step' に変換する", () => {
    const page = normalizePage({
      type: "flowchart",
      steps: [
        {
          id: "if1",
          type: "if",
          text: "cond",
          branches: { yes: [{ id: "b1", text: "x", done: true }], no: [] },
        },
      ],
    });
    const top = page.steps[0] as IfStep;
    expect(top.type).toBe("if");
    expect(top.branches.yes[0]).toEqual({ id: "b1", type: "step", text: "x", done: true });
    // ラベル未指定は既定値
    expect(top.labels).toEqual({ yes: "はい", no: "いいえ" });
  });

  it("分岐に入れ子になった if を再帰的に正規化する", () => {
    const page = normalizePage({
      steps: [
        {
          id: "if1",
          type: "if",
          branches: {
            yes: [{ id: "if2", type: "if", branches: { yes: [{ id: "deep", text: "d", done: false }], no: [] } }],
            no: [],
          },
        },
      ],
    });
    const nested = (page.steps[0] as IfStep).branches.yes[0] as IfStep;
    expect(nested.type).toBe("if");
    const deep = nested.branches.yes[0] as NormalStep;
    expect(deep).toEqual({ id: "deep", type: "step", text: "d", done: false });
  });

  it("ネストを含む文書をまるごと往復できる", () => {
    const state = normalizeState({
      activeNotebookId: "nb1",
      notebooks: [
        {
          id: "nb1",
          name: "テスト",
          type: "profile",
          color: "#C9B6E4",
          activePageId: "pg1",
          pages: [
            {
              id: "pg1",
              type: "flowchart",
              title: "t",
              steps: [
                {
                  id: "if1",
                  type: "if",
                  text: "cond",
                  labels: { yes: "Y", no: "N" },
                  branches: {
                    yes: [
                      { id: "s1", text: "plain", done: false },
                      {
                        id: "if2",
                        type: "if",
                        text: "nested",
                        branches: { yes: [{ id: "s2", text: "deep", done: true }], no: [] },
                      },
                    ],
                    no: [],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(state.activeNotebookId).toBe("nb1");
    const top = state.notebooks[0]?.pages[0]?.steps[0] as IfStep;
    expect(top.labels).toEqual({ yes: "Y", no: "N" });
    expect((top.branches.yes[0] as NormalStep).type).toBe("step");
    const nested = top.branches.yes[1] as IfStep;
    expect(nested.type).toBe("if");
    expect(nested.text).toBe("nested");
    expect(nested.branches.yes[0]).toEqual({ id: "s2", type: "step", text: "deep", done: true });
  });

  it("ネストも含めて重複 id を解消する", () => {
    const state = normalizeState({
      notebooks: [
        {
          id: "nb1",
          type: "profile",
          activePageId: "pg1",
          pages: [
            {
              id: "pg1",
              steps: [
                { id: "dup", type: "step", text: "top" },
                { id: "if1", type: "if", branches: { yes: [{ id: "dup", text: "branch" }], no: [] } },
              ],
            },
          ],
        },
      ],
    });
    const steps = state.notebooks[0]?.pages[0]?.steps ?? [];
    const branchId = (steps[1] as IfStep).branches.yes[0]?.id;
    expect(steps[0]?.id).toBe("dup");
    expect(branchId).toBeTruthy();
    expect(branchId).not.toBe("dup");
  });

  it("無効な activeNotebookId は null になる", () => {
    const state = normalizeState({
      activeNotebookId: "does-not-exist",
      notebooks: [{ id: "nb1", type: "profile", activePageId: "pg1", pages: [{ id: "pg1", steps: [] }] }],
    });
    expect(state.activeNotebookId).toBeNull();
  });
});

describe("normalizeNotebook", () => {
  it("非オブジェクトは null", () => {
    expect(normalizeNotebook(null)).toBeNull();
    expect(normalizeNotebook(42)).toBeNull();
  });

  it("有効なページが無ければ null", () => {
    expect(normalizeNotebook({ id: "nb1", pages: [] })).toBeNull();
  });

  // Web版だけが書き出していた旧タイプ名は、互換を打ち切ったので既定値に落ちる。
  it("知らない type は profile に落とす", () => {
    const nb = normalizeNotebook({
      id: "nb1",
      type: "rollbahn",
      activePageId: "pg1",
      pages: [{ id: "pg1", steps: [] }],
    });
    expect(nb?.type).toBe("profile");
  });

  it("notestyle でも note はそのまま残す（シェイプへは動かさない）", () => {
    const nb = normalizeNotebook({
      id: "nb1",
      type: "notestyle",
      activePageId: "pg1",
      pages: [{ id: "pg1", type: "notebook", note: "メモ本文", shapes: [] }],
    });
    const page = nb?.pages[0];
    expect(page?.note).toBe("メモ本文");
    expect(page?.shapes).toHaveLength(0);
  });

  it("activePageId が無効なら先頭ページに合わせる", () => {
    const nb = normalizeNotebook({
      id: "nb1",
      type: "profile",
      activePageId: "nope",
      pages: [
        { id: "pg1", steps: [] },
        { id: "pg2", steps: [] },
      ],
    });
    expect(nb?.activePageId).toBe("pg1");
  });
});

describe("normalizePage", () => {
  it("空オブジェクトから既定値を埋める", () => {
    const p = normalizePage({});
    expect(p.type).toBe("flowchart");
    expect(p.frame).toBe("aurora");
    expect(p.ruleStyle).toBe("lines");
    expect(p.paperColor).toBe("#FFFFFF");
    expect(p.steps).toEqual([]);
  });

  it("存在しないシェイプを指す矢印は除去し、両端がそろう矢印は残す", () => {
    const p = normalizePage({
      shapes: [
        { id: "sh1", text: "A", x: 0, y: 0, w: 150, rot: 0 },
        { id: "sh2", text: "B", x: 0, y: 0, w: 150, rot: 0 },
      ],
      arrows: [
        { id: "ar1", from: "sh1", to: "sh2", manual: false },
        { id: "ar2", from: "sh1", to: "ghost", manual: false },
      ],
    });
    expect(p.arrows.map((a) => a.id)).toEqual(["ar1"]);
  });

  it("不正な dataUrl の写真は除去する", () => {
    const p = normalizePage({
      photos: [
        { id: "ph1", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,AAAA" },
        { id: "ph2", x: 0, y: 0, w: 140, rot: 0, dataUrl: "not-an-image" },
      ],
    });
    expect(p.photos.map((ph) => ph.id)).toEqual(["ph1"]);
  });
});

describe("正規化の細部（クランプ・フォールバック・矢印）", () => {
  it("ステッカーは種別・座標・サイズをクランプ／既定化する", () => {
    const p = normalizePage({
      stickers: [
        { id: "st1", type: "bogus", x: -5, y: 99999, size: 999, rot: 12 },
        { id: "st2", type: "heart", x: 10, y: 20, size: 44, rot: 0 },
      ],
    });
    expect(p.stickers[0]?.type).toBe("star");
    expect(p.stickers[0]?.x).toBe(0);
    expect(p.stickers[0]?.y).toBe(20000);
    expect(p.stickers[0]?.size).toBe(160);
    expect(p.stickers[1]?.type).toBe("heart");
  });

  it("シェイプ幅はクランプし、数値でない座標は 0 にする", () => {
    const p = normalizePage({
      shapes: [
        { id: "sh1", text: "wide", x: "oops", y: 5, w: 9999, rot: 0 },
        { id: "sh2", text: "narrow", x: 0, y: 0, w: 1, rot: 0 },
      ],
    });
    expect(p.shapes[0]?.w).toBe(420);
    expect(p.shapes[0]?.x).toBe(0);
    expect(p.shapes[1]?.w).toBe(80);
  });

  // Web版だけが使っていた image フィールドは、互換を打ち切ったので読まない。
  it("dataUrl が無い写真は捨てる（image フィールドは見ない）", () => {
    const p = normalizePage({
      photos: [{ id: "ph1", x: 0, y: 0, w: 140, rot: 0, image: "data:image/jpeg;base64,BBBB" }],
    });
    expect(p.photos).toHaveLength(0);
  });

  it("frame / ruleStyle / type が不正なら既定値に落とす", () => {
    const p = normalizePage({ type: "bogus", frame: "bogus", ruleStyle: "bogus", paperColor: "red" });
    expect(p.type).toBe("flowchart");
    expect(p.frame).toBe("aurora");
    expect(p.ruleStyle).toBe("lines");
    expect(p.paperColor).toBe("#FFFFFF");
  });

  it("手動矢印は範囲内なら保持し、範囲外なら自動に戻す", () => {
    const p = normalizePage({
      shapes: [
        { id: "sh1", x: 0, y: 0, w: 150, rot: 0 },
        { id: "sh2", x: 0, y: 0, w: 150, rot: 0 },
      ],
      arrows: [
        { id: "a-ok", from: "sh1", to: "sh2", manual: true, mx: 5, my: 6, length: 10, angle: 1.2 },
        { id: "a-len0", from: "sh1", to: "sh2", manual: true, mx: 5, my: 6, length: 0, angle: 0 },
        { id: "a-mx", from: "sh1", to: "sh2", manual: true, mx: 999999, my: 6, length: 10, angle: 0 },
        { id: "a-my", from: "sh1", to: "sh2", manual: true, mx: 6, my: 999999, length: 10, angle: 0 },
      ],
    });
    const byId = Object.fromEntries(p.arrows.map((a) => [a.id, a]));
    expect(byId["a-ok"]).toMatchObject({ manual: true, mx: 5, my: 6, length: 10, angle: 1.2 });
    expect(byId["a-len0"]).toMatchObject({ manual: false, mx: 0, my: 0, length: 0 });
    expect(byId["a-mx"]?.manual).toBe(false);
    expect(byId["a-my"]?.manual).toBe(false);
  });

  it("from / to が欠けた矢印は捨てる", () => {
    const p = normalizePage({
      shapes: [{ id: "sh2", x: 0, y: 0, w: 150, rot: 0 }],
      arrows: [{ id: "nofrom", to: "sh2", manual: false }],
    });
    expect(p.arrows).toHaveLength(0);
  });

  it("不正な色は notebook の既定色に落とす", () => {
    const bad = normalizeNotebook({
      id: "nb1",
      type: "profile",
      color: "red",
      activePageId: "pg1",
      pages: [{ id: "pg1", steps: [] }],
    });
    expect(bad?.color).toBe("#C9B6E4");
    const good = normalizeNotebook({
      id: "nb2",
      type: "profile",
      color: "#A8E6CF",
      activePageId: "pg1",
      pages: [{ id: "pg1", steps: [] }],
    });
    expect(good?.color).toBe("#A8E6CF");
  });

  it("写真 id がシェイプや他の写真と衝突したら振り直す", () => {
    const state = normalizeState({
      notebooks: [
        {
          id: "nb1",
          type: "profile",
          activePageId: "pg1",
          pages: [
            {
              id: "pg1",
              shapes: [{ id: "shared", x: 0, y: 0, w: 150, rot: 0 }],
              photos: [
                { id: "shared", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,AAAA" },
                { id: "dup", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,BBBB" },
                { id: "dup", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,CCCC" },
              ],
            },
          ],
        },
      ],
    });
    const photos = state.notebooks[0]?.pages[0]?.photos ?? [];
    const ids = photos.map((ph) => ph.id);
    expect(photos).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain("shared");
  });
});

describe("id 採番と全要素の走査", () => {
  const genId = /^id\d+_/;

  it("id が無い工程・ステッカー・シェイプ・写真には新しい id を振る", () => {
    const p = normalizePage({
      steps: [
        { type: "step", text: "no-id-step" },
        { type: "if", text: "no-id-if", branches: { yes: [{ text: "no-id-branch" }], no: [] } },
      ],
      stickers: [{ type: "star", x: 0, y: 0, size: 44, rot: 0 }],
      shapes: [{ text: "s", x: 0, y: 0, w: 150, rot: 0 }],
      photos: [{ x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,AAAA" }],
    });
    const top = p.steps[1] as IfStep;
    expect(p.steps[0]?.id).toMatch(genId);
    expect(top.id).toMatch(genId);
    expect(top.branches.yes[0]?.id).toMatch(genId);
    expect(p.stickers[0]?.id).toMatch(genId);
    expect(p.shapes[0]?.id).toMatch(genId);
    expect(p.photos[0]?.id).toMatch(genId);
  });

  it("id が無い矢印にも新しい id を振る", () => {
    const p = normalizePage({
      shapes: [
        { id: "sh1", x: 0, y: 0, w: 150, rot: 0 },
        { id: "sh2", x: 0, y: 0, w: 150, rot: 0 },
      ],
      arrows: [{ from: "sh1", to: "sh2", manual: false }],
    });
    expect(p.arrows[0]?.id).toMatch(genId);
  });

  it("id が無い notebook にも新しい id を振る", () => {
    const nb = normalizeNotebook({ type: "profile", activePageId: "pg1", pages: [{ id: "pg1", steps: [] }] });
    expect(nb?.id).toMatch(genId);
  });

  it("seedUid はステッカー・矢印・両分岐まで走査し、空 id は無視する", () => {
    seedUid({
      activeNotebookId: null,
      notebooks: [
        {
          id: "id10_a",
          name: "",
          type: "profile",
          color: "#C9B6E4",
          activePageId: "id20_b",
          pages: [
            {
              ...newPage(),
              id: "id20_b",
              steps: [ifStep("id30_c", [plain("id40_y")], [plain("id2000_n"), ifStep("id50_z", [plain("id60_d")])])],
              stickers: [{ id: "id70_s", type: "star", x: 0, y: 0, rot: 0, size: 44 }],
              shapes: [{ id: "", text: "", x: 0, y: 0, w: 150, rot: 0 }],
              photos: [{ id: "id80_p", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,AAAA" }],
              arrows: [
                { id: "id90_a", from: "id70_s", to: "id70_s", manual: false, mx: 0, my: 0, length: 0, angle: 0 },
              ],
            },
          ],
        },
      ],
    });
    // no 分岐にある id2000 が最大なので、次の採番は 2001。
    expect(idNum(newId())).toBe(2001);
  });

  it("normalizeState はステッカー・矢印・no 分岐まで dedupe を通す", () => {
    const state = normalizeState({
      notebooks: [
        {
          id: "nb1",
          type: "profile",
          activePageId: "pg1",
          pages: [
            {
              id: "pg1",
              steps: [
                { id: "if1", type: "if", branches: { yes: [{ id: "y1", text: "y" }], no: [{ id: "n1", text: "n" }] } },
              ],
              stickers: [{ id: "st1", type: "star", x: 0, y: 0, rot: 0, size: 44 }],
              shapes: [
                { id: "sh1", x: 0, y: 0, w: 150, rot: 0 },
                { id: "sh2", x: 0, y: 0, w: 150, rot: 0 },
              ],
              arrows: [{ id: "ar1", from: "sh1", to: "sh2", manual: false }],
            },
          ],
        },
      ],
    });
    const pg = state.notebooks[0]?.pages[0];
    const steps = pg?.steps ?? [];
    expect(pg?.stickers).toHaveLength(1);
    expect(pg?.arrows).toHaveLength(1);
    expect((steps[0] as IfStep).branches.no.map((s) => s.id)).toEqual(["n1"]);
  });
});

describe("moveStepInTree", () => {
  it("トップレベルの工程を前後に動かす", () => {
    const tree: Step[] = [plain("a"), plain("b"), plain("c")];
    expect(moveStepInTree(tree, "b", -1).map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(moveStepInTree(tree, "b", 1).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });

  it("端では動かさない", () => {
    const tree: Step[] = [plain("a"), plain("b")];
    expect(moveStepInTree(tree, "a", -1).map((s) => s.id)).toEqual(["a", "b"]);
    expect(moveStepInTree(tree, "b", 1).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("分岐の中でも同じ並びの中だけで動く", () => {
    const tree: Step[] = [ifStep("if1", [plain("y1"), plain("y2"), plain("y3")], [plain("n1")])];
    const out = moveStepInTree(tree, "y3", -1);
    const top = out[0] as IfStep;
    expect(top.branches.yes.map((s) => s.id)).toEqual(["y1", "y3", "y2"]);
    expect(top.branches.no.map((s) => s.id)).toEqual(["n1"]);
  });

  it("入れ子の if カード自体も並べ替えられる", () => {
    const tree: Step[] = [ifStep("if1", [plain("y1"), ifStep("if2")], [])];
    const out = moveStepInTree(tree, "if2", -1);
    expect((out[0] as IfStep).branches.yes.map((s) => s.id)).toEqual(["if2", "y1"]);
  });

  it("見つからない id なら何も変わらない", () => {
    const tree: Step[] = [plain("a"), ifStep("if1", [plain("y1")])];
    expect(moveStepInTree(tree, "zzz", 1).map((s) => s.id)).toEqual(["a", "if1"]);
  });
});

describe("copyName", () => {
  it("「〜のコピー」を付ける", () => {
    expect(copyName("メモ帳", 30)).toBe("メモ帳のコピー");
  });

  it("上限を超えるときは元の名前を詰める", () => {
    const long = "あ".repeat(30);
    const out = copyName(long, 30);
    expect(out).toHaveLength(30);
    expect(out.endsWith("のコピー")).toBe(true);
  });

  it("上限が接尾辞より短くても接尾辞は残す", () => {
    expect(copyName("あいうえお", 2)).toBe("のコピー");
  });
});

describe("duplicatePage", () => {
  const source = (): Page => ({
    ...newPage("flowchart", "元ページ"),
    steps: [plain("s1", "工程"), ifStep("if1", [plain("y1")], [])],
    stickers: [{ id: "st1", type: "star", x: 1, y: 2, rot: 3, size: 44 }],
    shapes: [
      { id: "sh1", text: "A", x: 0, y: 0, w: 150, rot: 0 },
      { id: "sh2", text: "B", x: 10, y: 10, w: 150, rot: 0 },
    ],
    photos: [{ id: "ph1", x: 0, y: 0, w: 140, rot: 0, dataUrl: "data:image/png;base64,AAAA" }],
    arrows: [{ id: "ar1", from: "sh1", to: "sh2", manual: false, mx: 0, my: 0, length: 0, angle: 0 }],
  });

  it("中身は保ちつつ、id はすべて振り直す", () => {
    const original = source();
    const copy = duplicatePage(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.steps[0]?.id).not.toBe("s1");
    expect((copy.steps[0] as NormalStep).text).toBe("工程");
    expect(copy.stickers[0]?.id).not.toBe("st1");
    expect(copy.shapes.map((s) => s.text)).toEqual(["A", "B"]);
    expect(copy.shapes[0]?.id).not.toBe("sh1");
    expect(copy.photos[0]?.id).not.toBe("ph1");
    expect(copy.photos[0]?.dataUrl).toBe("data:image/png;base64,AAAA");
  });

  it("ネストした分岐の工程まで振り直す", () => {
    const copy = duplicatePage(source());
    const branch = (copy.steps[1] as IfStep).branches.yes[0];
    expect(branch?.id).not.toBe("y1");
    expect((copy.steps[1] as IfStep).id).not.toBe("if1");
  });

  it("矢印は新しいシェイプ id へつなぎ直す", () => {
    const copy = duplicatePage(source());
    const arrow = copy.arrows[0];
    expect(arrow?.from).toBe(copy.shapes[0]?.id);
    expect(arrow?.to).toBe(copy.shapes[1]?.id);
  });

  it("参照先を失った矢印は落とす", () => {
    const page: Page = {
      ...newPage(),
      shapes: [],
      arrows: [{ id: "ar1", from: "ghost", to: "ghost2", manual: false, mx: 0, my: 0, length: 0, angle: 0 }],
    };
    expect(duplicatePage(page).arrows).toHaveLength(0);
  });

  it("タイトルは「〜のコピー」、無題なら無題のまま", () => {
    expect(duplicatePage(source()).title).toBe("元ページのコピー");
    expect(duplicatePage({ ...newPage(), title: "" }).title).toBe("");
  });

  it("元のページは書き換えない", () => {
    const original = source();
    duplicatePage(original);
    expect(original.steps[0]?.id).toBe("s1");
    expect(original.shapes[0]?.id).toBe("sh1");
  });
});

describe("duplicateNotebook", () => {
  const source = (): Notebook => {
    const first = { ...newPage("flowchart", "1"), id: "pg1" };
    const second = { ...newPage("flowchart", "2"), id: "pg2" };
    return { id: "nb1", name: "手帳", type: "profile", color: "#C9B6E4", activePageId: "pg2", pages: [first, second] };
  };

  it("名前に「のコピー」を付けて、ページも全部複製する", () => {
    const copy = duplicateNotebook(source());
    expect(copy.name).toBe("手帳のコピー");
    expect(copy.id).not.toBe("nb1");
    expect(copy.pages).toHaveLength(2);
    expect(copy.pages.map((p) => p.id)).not.toContain("pg1");
  });

  it("ページ名はそのまま（手帳ごとコピーなので中は変えない）", () => {
    expect(duplicateNotebook(source()).pages.map((p) => p.title)).toEqual(["1", "2"]);
  });

  it("開いていたページの位置を引き継ぐ", () => {
    const copy = duplicateNotebook(source());
    expect(copy.activePageId).toBe(copy.pages[1]?.id);
  });

  it("activePageId が壊れていても先頭ページに落とす", () => {
    const copy = duplicateNotebook({ ...source(), activePageId: "missing" });
    expect(copy.activePageId).toBe(copy.pages[0]?.id);
  });

  it("無題の手帳は表示名からコピー名を作る", () => {
    const copy = duplicateNotebook({ ...source(), name: "", type: "notestyle" });
    expect(copy.name).toBe("無題のノートのコピー");
  });

  it("ページが1枚も無い（壊れた）手帳でも落ちない", () => {
    const copy = duplicateNotebook({ ...source(), pages: [] });
    expect(copy.pages).toEqual([]);
    expect(copy.activePageId).toBe("pg2");
  });
});

describe("stepProgress", () => {
  it("トップレベルと分岐の中を合わせて数える", () => {
    const tree: Step[] = [
      plain("a", "", true),
      plain("b"),
      ifStep("if1", [plain("y1", "", true), plain("y2")], [plain("n1", "", true)]),
    ];
    expect(stepProgress(tree)).toEqual({ done: 3, total: 5 });
  });

  it("if カード自体は数に入れない", () => {
    expect(stepProgress([ifStep("if1")])).toEqual({ done: 0, total: 0 });
  });

  it("工程が無ければ 0/0", () => {
    expect(stepProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe("表示名ヘルパー", () => {
  it("notebookDisplayName", () => {
    expect(notebookDisplayName({ name: "マイ帳", type: "profile" })).toBe("マイ帳");
    expect(notebookDisplayName({ name: "", type: "notestyle" })).toBe("無題のノート");
    expect(notebookDisplayName({ name: "", type: "profile" })).toBe("無題のプロフィール帳");
  });

  it("pageDisplayTitle", () => {
    expect(pageDisplayTitle({ title: "1ページ目" })).toBe("1ページ目");
    expect(pageDisplayTitle({ title: "" })).toBe("無題のページ");
  });
});
