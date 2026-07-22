import { create } from "zustand";
import { diagnoseStorage, emptyState, loadState, saveState } from "@/lib/store";
import { newBranchStep, newId, newIfStep, newNotebook, newPage, newStep } from "@/lib/model";
import { STICKER_DEFAULT_SIZE } from "@/lib/types";
import type {
  AppState,
  Frame,
  Notebook,
  NotebookType,
  Page,
  PageType,
  RuleStyle,
  Sticker,
  StickerType,
} from "@/lib/types";

type BranchKey = "yes" | "no";

interface NotebooksState {
  ready: boolean;
  doc: AppState;
  storageOk: boolean;
  storageError: string;
  canUndo: boolean;

  initialize: () => void;
  recheckStorage: () => void;
  flushPending: () => void;
  /** 直前の操作を1手戻す。保存に失敗していて戻せなかった場合は false */
  undo: () => boolean;
  importState: (state: AppState) => void;

  /* 手帳（表紙） */
  createNotebook: (type: NotebookType, name: string, color: string) => string;
  deleteNotebook: (id: string) => void;
  renameNotebook: (id: string, name: string) => void;
  openNotebook: (id: string) => void;
  closeNotebook: () => void;

  /* ページ */
  addPage: (type: PageType) => void;
  setActivePage: (id: string) => void;
  deletePage: (id: string) => boolean;
  setPageTitle: (title: string) => void;
  setFrame: (frame: Frame) => void;
  toggleSparkle: () => void;
  setRuleStyle: (style: RuleStyle) => void;
  setPaperColor: (color: string) => void;
  setNote: (note: string) => void;
  resetPage: () => void;

  /* 工程（flowchart） */
  addStep: () => void;
  addIfStep: () => void;
  setStepText: (stepId: string, text: string) => void;
  toggleStep: (stepId: string) => boolean;
  moveStep: (index: number, dir: -1 | 1) => void;
  deleteStep: (stepId: string) => void;

  /* if分岐 */
  setBranchLabel: (stepId: string, key: BranchKey, label: string) => void;
  addBranchStep: (stepId: string, key: BranchKey) => void;
  setBranchStepText: (stepId: string, key: BranchKey, branchId: string, text: string) => void;
  toggleBranchStep: (stepId: string, key: BranchKey, branchId: string) => void;
  deleteBranchStep: (stepId: string, key: BranchKey, branchId: string) => void;

  /* シール */
  addSticker: (type: StickerType, x: number, y: number) => void;
  updateSticker: (id: string, patch: Partial<Pick<Sticker, "x" | "y" | "rot" | "size">>) => void;
  deleteSticker: (id: string) => void;

  /* フリーテキスト（notestyle） */
  addShape: (x: number, y: number) => void;
  setShapeText: (id: string, text: string) => void;
  updateShape: (id: string, patch: { x?: number; y?: number; w?: number; rot?: number }) => void;
  deleteShape: (id: string) => void;

  /* 写真（notestyle） */
  addPhoto: (dataUrl: string, x: number, y: number) => void;
  /** 選んだ時点のページに貼る（ピッカーの待ち時間中にページが変わっても取り違えない） */
  addPhotoTo: (notebookId: string, pageId: string, dataUrl: string, x: number, y: number) => void;
  updatePhoto: (id: string, patch: { x?: number; y?: number; w?: number; rot?: number }) => void;
  deletePhoto: (id: string) => void;

  /* つなぎ線（notestyle） */
  addArrow: (from: string, to: string) => void;
  updateArrow: (
    id: string,
    patch: { manual?: boolean; mx?: number; my?: number; length?: number; angle?: number },
  ) => void;
  resetArrow: (id: string) => void;
  deleteArrow: (id: string) => void;
}

const MAX_UNDO = 15;

const CORRUPT_MESSAGE =
  "保存データが壊れていて読めませんでした。壊れたデータは退避しました。新しく編集して上書きする前に、必要なら「📂 読み込み」でバックアップから復元してください。";

export const useNotebooks = create<NotebooksState>()((set, get) => {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  // 保留中（未保存）の変更バッチが undo 対象か。バッチに1つでもナビゲーション/構造変更が
  // 混ざれば false。保存失敗時も保持して、定期リトライがこのフラグで保存するようにする
  // （失敗した nav 保存を後からundo可能として再保存し、履歴のズレを蒸し返さないため）。
  let pendingUndoable = true;
  let lastCommitted: string | null = null;
  let undoStack: string[] = [];
  // 保存データが壊れて読めなかった状態。storage自体の健全性チェック（recheck）では
  // 消えないよう別に持つ。復元（importState）するまで警告を出し続ける。
  let loadCorrupt = false;
  // 写真のbase64は巨大。undoスナップショットに丸ごと含めると数MB×最大15手でOOMになりうる。
  // そこで blob はここに id ごとに1本だけ退避し、undoスナップショットは dataUrl を空にして持つ。
  const photoBlobs = new Map<string, string>();

  const capturePhotoBlobs = (doc: AppState): void => {
    for (const nb of doc.notebooks) {
      for (const pg of nb.pages) {
        for (const ph of pg.photos) {
          if (ph.dataUrl) photoBlobs.set(ph.id, ph.dataUrl);
        }
      }
    }
  };

  /** undo用の軽量スナップショット文字列（写真の dataUrl は空にして blob を載せない） */
  const snapshotFor = (doc: AppState): string => JSON.stringify(doc, (key, value) => (key === "dataUrl" ? "" : value));

  /** undoから復元した doc の写真 dataUrl を、退避してある blob で埋め戻す */
  const rehydratePhotos = (doc: AppState): AppState => {
    for (const nb of doc.notebooks) {
      for (const pg of nb.pages) {
        for (const ph of pg.photos) {
          if (!ph.dataUrl) ph.dataUrl = photoBlobs.get(ph.id) ?? "";
        }
      }
    }
    return doc;
  };

  /**
   * どの undo ベースライン（lastCommitted と undoStack の各スナップショット）にも
   * 出てこない写真 blob を捨てる。スナップショットは blob なしで軽いので走査は安い。
   * これで「消した写真を undo で復元」に必要な blob は残しつつ、際限なく溜まるのを防ぐ。
   */
  const pruneBlobs = (): void => {
    const referenced = new Set<string>();
    const collect = (snap: string | null): void => {
      if (!snap) return;
      try {
        const d = JSON.parse(snap) as AppState;
        for (const nb of d.notebooks) {
          for (const pg of nb.pages) {
            for (const ph of pg.photos) referenced.add(ph.id);
          }
        }
      } catch {
        // 壊れたスナップショットは無視（保守的に何も消さない方向へは倒さない）
      }
    };
    collect(lastCommitted);
    for (const snap of undoStack) collect(snap);
    for (const id of [...photoBlobs.keys()]) {
      if (!referenced.has(id)) photoBlobs.delete(id);
    }
  };

  const flushSave = (): void => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (!dirty) return;
    const doc = get().doc;
    capturePhotoBlobs(doc); // 現在の写真blobを退避（undoスナップショットには載せない）
    const snapshot = snapshotFor(doc); // undo比較・スタック用（blobなし・軽量）
    try {
      saveState(doc); // 実保存は写真込みのフルdoc（SQLiteへ）
      // 書き込みが成功したときにだけ dirty をおろす。失敗時は true のままにして、
      // 次の編集・アプリ復帰・定期リトライで再保存を試みる（保存失敗でも変更を失わない）。
      dirty = false;
      if (!get().storageOk) set({ storageOk: true, storageError: "" });
      // ナビゲーションだけの変更（手帳の開閉・ページ切替・作成/削除）はundo対象にしない。
      // undoで表示中のルートと state がずれて「見つかりません」に落ちるのを防ぐ。
      if (pendingUndoable && lastCommitted !== null && lastCommitted !== snapshot) {
        undoStack.push(lastCommitted);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        set({ canUndo: true });
      }
      lastCommitted = snapshot;
      pendingUndoable = true; // バッチ確定。次のバッチはundo可能から数え直す
      pruneBlobs(); // undoベースラインに残っていない写真blobだけ解放
    } catch (e) {
      const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      set({ storageOk: false, storageError: message });
    }
  };

  const scheduleSave = (): void => {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 400);
  };

  interface CommitOpts {
    immediate?: boolean;
    undoable?: boolean;
  }

  const commit = (doc: AppState, opts?: CommitOpts): void => {
    const immediate = opts?.immediate ?? true;
    const undoable = opts?.undoable ?? true;
    // 直前のデバウンス編集（タイトルやカードのテキスト入力）が未確定のまま、
    // 別の即時アクション（削除など）が来たら、先にその編集を確定させておく。
    // こうすると undo の復元先が「このアクションの直前（入力を含む）」になり、
    // 消す直前に打った文字が失われない。連続テキスト入力は immediate:false なので巻き込まない。
    if (immediate && dirty) flushSave();
    set({ doc });
    dirty = true;
    // バッチに nav 変更が混ざれば、このバッチ全体を undo 対象外にする
    pendingUndoable = pendingUndoable && undoable;
    if (immediate) flushSave();
    else scheduleSave();
    if (!undoable) {
      // ナビゲーション/構造変更（手帳の開閉・作成・削除、ページ切替）をまたぐと、
      // 以前のundoスナップショットは今の手帳/ページを含まず、復元するとルートと
      // stateがずれて「見つかりません」に落ちる。undoは「今の文脈で直前にした編集」
      // だけを対象にしたいので、ここで履歴を破棄する（新しいdocは上で保存済み）。
      undoStack = [];
      // 写真blobは消さない。lastCommitted（nav後の新ベースライン）がまだ参照しており、
      // 直後に写真を消して undo すると復元できなくなるため。不要分は次の flushSave の
      // pruneBlobs が undoStack=[] を見て解放する。
      pruneBlobs();
      if (get().canUndo) set({ canUndo: false });
    }
  };

  /** 保留中の未保存編集を強制的に書き出す（アプリのバックグラウンド化・定期リトライ用）。
   * 保留バッチの undo 対象フラグ（pendingUndoable）を尊重して保存する。 */
  const flushPending = (): void => {
    if (dirty) flushSave();
  };

  const mapActiveNotebook = (fn: (nb: Notebook) => Notebook): AppState => {
    const doc = get().doc;
    if (!doc.activeNotebookId) return doc;
    return { ...doc, notebooks: doc.notebooks.map((nb) => (nb.id === doc.activeNotebookId ? fn(nb) : nb)) };
  };

  const mapActivePage = (fn: (pg: Page) => Page): AppState =>
    mapActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((pg) => (pg.id === nb.activePageId ? fn(pg) : pg)),
    }));

  return {
    ready: false,
    doc: emptyState(),
    storageOk: true,
    storageError: "",
    canUndo: false,

    initialize: () => {
      const { state: doc, corrupt } = loadState();
      const diag = diagnoseStorage();
      photoBlobs.clear();
      capturePhotoBlobs(doc);
      lastCommitted = snapshotFor(doc);
      undoStack = [];
      loadCorrupt = corrupt;
      // 保存データが壊れていた場合は、上書き前に必ず気づけるよう警告を出す（生データは退避済み）
      set({
        ready: true,
        doc,
        storageOk: diag.ok && !corrupt,
        storageError: corrupt ? CORRUPT_MESSAGE : diag.error,
        canUndo: false,
      });
    },

    recheckStorage: () => {
      const diag = diagnoseStorage();
      // storage が健全でも、壊れデータのロード警告は復元するまで消さない
      set({
        storageOk: diag.ok && !loadCorrupt,
        storageError: loadCorrupt ? CORRUPT_MESSAGE : diag.error,
      });
    },

    undo: () => {
      // 保留中のデバウンス編集があれば先に確定して undo チェックポイントにする。
      // これでタイプ直後（400ms以内）に↩️を押しても、まず直前の入力が1手戻る対象になり、
      // 古いスナップショットへ飛んで最新の入力が失われるのを防ぐ。
      // 保留中のデバウンス編集を先に確定。ここで保存が失敗（dirtyのまま）なら、
      // undoで未保存の入力を捨てないよう中断する。
      if (dirty) {
        flushSave();
        if (dirty) return false;
      }
      const prev = undoStack.pop();
      if (prev === undefined) return false;
      // スナップショットは写真blobを持たないので、退避してあるblobで埋め戻す
      const restored = rehydratePhotos(JSON.parse(prev) as AppState);
      // どの手帳を開いているか（ルーター主導のナビゲーション）はundoで変えない
      restored.activeNotebookId = get().doc.activeNotebookId;
      lastCommitted = snapshotFor(restored);
      set({ doc: restored, canUndo: undoStack.length > 0 });
      dirty = true;
      pendingUndoable = false;
      flushSave();
      return true;
    },

    importState: (state) => {
      photoBlobs.clear();
      capturePhotoBlobs(state);
      lastCommitted = snapshotFor(state);
      undoStack = [];
      loadCorrupt = false; // 復元できたので壊れデータ警告は解除
      set({ doc: state, canUndo: false });
      dirty = true;
      pendingUndoable = false;
      flushSave();
    },

    flushPending,

    /* ---------------- 手帳 ---------------- */

    // 手帳の作成・削除・開閉・ページ切替はナビゲーション操作。undo対象にしない。
    createNotebook: (type, name, color) => {
      const nb = newNotebook(type, name, color);
      const doc = get().doc;
      commit({ activeNotebookId: nb.id, notebooks: [...doc.notebooks, nb] }, { undoable: false });
      return nb.id;
    },

    deleteNotebook: (id) => {
      const doc = get().doc;
      commit(
        {
          activeNotebookId: doc.activeNotebookId === id ? null : doc.activeNotebookId,
          notebooks: doc.notebooks.filter((nb) => nb.id !== id),
        },
        { undoable: false },
      );
    },

    renameNotebook: (id, name) => {
      const doc = get().doc;
      commit({ ...doc, notebooks: doc.notebooks.map((nb) => (nb.id === id ? { ...nb, name } : nb)) });
    },

    openNotebook: (id) => commit({ ...get().doc, activeNotebookId: id }, { undoable: false }),
    closeNotebook: () => commit({ ...get().doc, activeNotebookId: null }, { undoable: false }),

    /* ---------------- ページ ---------------- */

    addPage: (type) =>
      commit(
        mapActiveNotebook((nb) => {
          const page = newPage(type, "");
          return { ...nb, pages: [...nb.pages, page], activePageId: page.id };
        }),
        { undoable: false },
      ),

    // 実際にページが変わるときだけコミットする。すでに選択中／存在しないID
    // （削除ボタンのタップが親タブに伝わったケース等）では何もしない。
    // 無駄なコミットで undo 履歴が消える／消したページを選び直す事故を防ぐ。
    setActivePage: (id) => {
      const doc = get().doc;
      const nb = doc.notebooks.find((n) => n.id === doc.activeNotebookId);
      if (!nb || nb.activePageId === id || !nb.pages.some((p) => p.id === id)) return;
      commit(
        mapActiveNotebook((n) => ({ ...n, activePageId: id })),
        { undoable: false },
      );
    },

    deletePage: (id) => {
      const doc = get().doc;
      const nb = doc.notebooks.find((n) => n.id === doc.activeNotebookId);
      if (!nb || nb.pages.length <= 1) return false;
      commit(
        mapActiveNotebook((n) => {
          const idx = n.pages.findIndex((p) => p.id === id);
          const pages = n.pages.filter((p) => p.id !== id);
          const activePageId =
            n.activePageId === id
              ? (pages[Math.max(0, idx - 1)]?.id ?? pages[0]?.id ?? n.activePageId)
              : n.activePageId;
          return { ...n, pages, activePageId };
        }),
      );
      return true;
    },

    setPageTitle: (title) =>
      commit(
        mapActivePage((pg) => ({ ...pg, title })),
        { immediate: false },
      ),
    setFrame: (frame) => commit(mapActivePage((pg) => ({ ...pg, frame }))),
    toggleSparkle: () => commit(mapActivePage((pg) => ({ ...pg, sparkleOn: !pg.sparkleOn }))),
    setRuleStyle: (ruleStyle) => commit(mapActivePage((pg) => ({ ...pg, ruleStyle }))),
    setPaperColor: (paperColor) => commit(mapActivePage((pg) => ({ ...pg, paperColor }))),
    setNote: (note) =>
      commit(
        mapActivePage((pg) => ({ ...pg, note })),
        { immediate: false },
      ),

    resetPage: () =>
      commit(mapActivePage((pg) => ({ ...pg, steps: [], stickers: [], shapes: [], photos: [], arrows: [], note: "" }))),

    /* ---------------- 工程 ---------------- */

    addStep: () => commit(mapActivePage((pg) => ({ ...pg, steps: [...pg.steps, newStep()] }))),
    addIfStep: () => commit(mapActivePage((pg) => ({ ...pg, steps: [...pg.steps, newIfStep()] }))),

    setStepText: (stepId, text) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) => (s.id === stepId ? { ...s, text } : s)),
        })),
        { immediate: false },
      ),

    toggleStep: (stepId) => {
      let nowDone = false;
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) => {
            if (s.id !== stepId || s.type !== "step") return s;
            nowDone = !s.done;
            return { ...s, done: nowDone };
          }),
        })),
      );
      return nowDone;
    },

    moveStep: (index, dir) =>
      commit(
        mapActivePage((pg) => {
          const target = index + dir;
          if (target < 0 || target >= pg.steps.length) return pg;
          const steps = pg.steps.slice();
          const a = steps[index];
          const b = steps[target];
          if (!a || !b) return pg;
          steps[index] = b;
          steps[target] = a;
          return { ...pg, steps };
        }),
      ),

    deleteStep: (stepId) => commit(mapActivePage((pg) => ({ ...pg, steps: pg.steps.filter((s) => s.id !== stepId) }))),

    /* ---------------- if分岐 ---------------- */

    setBranchLabel: (stepId, key, label) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) =>
            s.id === stepId && s.type === "if" ? { ...s, labels: { ...s.labels, [key]: label } } : s,
          ),
        })),
        { immediate: false },
      ),

    addBranchStep: (stepId, key) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) =>
            s.id === stepId && s.type === "if"
              ? { ...s, branches: { ...s.branches, [key]: [...s.branches[key], newBranchStep()] } }
              : s,
          ),
        })),
      ),

    setBranchStepText: (stepId, key, branchId, text) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) => {
            if (s.id !== stepId || s.type !== "if") return s;
            return {
              ...s,
              branches: {
                ...s.branches,
                [key]: s.branches[key].map((b) => (b.id === branchId ? { ...b, text } : b)),
              },
            };
          }),
        })),
        { immediate: false },
      ),

    toggleBranchStep: (stepId, key, branchId) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) => {
            if (s.id !== stepId || s.type !== "if") return s;
            return {
              ...s,
              branches: {
                ...s.branches,
                [key]: s.branches[key].map((b) => (b.id === branchId ? { ...b, done: !b.done } : b)),
              },
            };
          }),
        })),
      ),

    deleteBranchStep: (stepId, key, branchId) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          steps: pg.steps.map((s) => {
            if (s.id !== stepId || s.type !== "if") return s;
            return { ...s, branches: { ...s.branches, [key]: s.branches[key].filter((b) => b.id !== branchId) } };
          }),
        })),
      ),

    /* ---------------- シール ---------------- */

    addSticker: (type, x, y) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          stickers: [
            ...pg.stickers,
            { id: newId(), type, x, y, rot: Math.round(Math.random() * 30 - 15), size: STICKER_DEFAULT_SIZE },
          ],
        })),
      ),

    updateSticker: (id, patch) =>
      commit(
        mapActivePage((pg) => ({ ...pg, stickers: pg.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      ),

    deleteSticker: (id) => commit(mapActivePage((pg) => ({ ...pg, stickers: pg.stickers.filter((s) => s.id !== id) }))),

    /* ---------------- フリーテキスト ---------------- */

    addShape: (x, y) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          shapes: [...pg.shapes, { id: newId(), text: "", x, y, w: 150, rot: 0 }],
        })),
      ),

    setShapeText: (id, text) =>
      commit(
        mapActivePage((pg) => ({ ...pg, shapes: pg.shapes.map((s) => (s.id === id ? { ...s, text } : s)) })),
        { immediate: false },
      ),

    updateShape: (id, patch) =>
      commit(mapActivePage((pg) => ({ ...pg, shapes: pg.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))),

    deleteShape: (id) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          shapes: pg.shapes.filter((s) => s.id !== id),
          arrows: pg.arrows.filter((a) => a.from !== id && a.to !== id),
        })),
      ),

    /* ---------------- 写真 ---------------- */

    addPhoto: (dataUrl, x, y) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          photos: [...pg.photos, { id: newId(), x, y, w: 140, rot: 0, dataUrl }],
        })),
      ),

    addPhotoTo: (notebookId, pageId, dataUrl, x, y) => {
      const doc = get().doc;
      commit({
        ...doc,
        notebooks: doc.notebooks.map((nb) =>
          nb.id !== notebookId
            ? nb
            : {
                ...nb,
                pages: nb.pages.map((pg) =>
                  pg.id !== pageId
                    ? pg
                    : { ...pg, photos: [...pg.photos, { id: newId(), x, y, w: 140, rot: 0, dataUrl }] },
                ),
              },
        ),
      });
    },

    updatePhoto: (id, patch) =>
      commit(mapActivePage((pg) => ({ ...pg, photos: pg.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))),

    deletePhoto: (id) => commit(mapActivePage((pg) => ({ ...pg, photos: pg.photos.filter((p) => p.id !== id) }))),

    /* ---------------- つなぎ線 ---------------- */

    addArrow: (from, to) =>
      commit(
        mapActivePage((pg) => {
          // 両端のテキストが実在するときだけ線を張る（undo/リセットで消えたカードを
          // 指したまま接続すると、見えない線がデータに残るのを防ぐ）
          const bothExist = pg.shapes.some((s) => s.id === from) && pg.shapes.some((s) => s.id === to);
          if (from === to || !bothExist || pg.arrows.some((a) => a.from === from && a.to === to)) return pg;
          return {
            ...pg,
            arrows: [...pg.arrows, { id: newId(), from, to, manual: false, mx: 0, my: 0, length: 0, angle: 0 }],
          };
        }),
      ),

    updateArrow: (id, patch) =>
      commit(mapActivePage((pg) => ({ ...pg, arrows: pg.arrows.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))),

    resetArrow: (id) =>
      commit(
        mapActivePage((pg) => ({ ...pg, arrows: pg.arrows.map((a) => (a.id === id ? { ...a, manual: false } : a)) })),
      ),

    deleteArrow: (id) => commit(mapActivePage((pg) => ({ ...pg, arrows: pg.arrows.filter((a) => a.id !== id) }))),
  };
});

/* ---------------- セレクタ ---------------- */

export function selectCurrentNotebook(s: NotebooksState): Notebook | undefined {
  return s.doc.notebooks.find((n) => n.id === s.doc.activeNotebookId);
}

export function selectCurrentPage(s: NotebooksState): Page | undefined {
  const nb = selectCurrentNotebook(s);
  if (!nb) return undefined;
  return nb.pages.find((p) => p.id === nb.activePageId) ?? nb.pages[0];
}
