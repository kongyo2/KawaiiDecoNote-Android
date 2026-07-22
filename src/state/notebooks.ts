import { create } from "zustand";
import { diagnoseStorage, emptyState, loadState, saveState } from "@/lib/store";
import { newBranchStep, newId, newIfStep, newNotebook, newPage, newStep } from "@/lib/model";
import { PHOTO_DEFAULT_WIDTH, SHAPE_DEFAULT_WIDTH, STICKER_DEFAULT_SIZE } from "@/lib/types";
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
  undo: () => boolean;
  importState: (state: AppState) => void;

  createNotebook: (type: NotebookType, name: string, color: string) => string;
  deleteNotebook: (id: string) => void;
  renameNotebook: (id: string, name: string) => void;
  openNotebook: (id: string) => void;
  closeNotebook: () => void;

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

  addStep: () => void;
  addIfStep: () => void;
  setStepText: (stepId: string, text: string) => void;
  toggleStep: (stepId: string) => boolean;
  moveStep: (index: number, dir: -1 | 1) => void;
  deleteStep: (stepId: string) => void;

  setBranchLabel: (stepId: string, key: BranchKey, label: string) => void;
  addBranchStep: (stepId: string, key: BranchKey) => void;
  setBranchStepText: (stepId: string, key: BranchKey, branchId: string, text: string) => void;
  toggleBranchStep: (stepId: string, key: BranchKey, branchId: string) => void;
  deleteBranchStep: (stepId: string, key: BranchKey, branchId: string) => void;

  addSticker: (type: StickerType, x: number, y: number) => void;
  updateSticker: (id: string, patch: Partial<Pick<Sticker, "x" | "y" | "rot" | "size">>) => void;
  deleteSticker: (id: string) => void;

  addShape: (x: number, y: number) => void;
  setShapeText: (id: string, text: string) => void;
  updateShape: (id: string, patch: { x?: number; y?: number; w?: number; rot?: number }) => void;
  deleteShape: (id: string) => void;

  addPhotoTo: (notebookId: string, pageId: string, dataUrl: string, x: number, y: number) => void;
  updatePhoto: (id: string, patch: { x?: number; y?: number; w?: number; rot?: number }) => void;
  deletePhoto: (id: string) => void;

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
  let pendingUndoable = true;
  let lastCommitted: string | null = null;
  let undoStack: string[] = [];
  let loadCorrupt = false;
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

  const snapshotFor = (doc: AppState): string => JSON.stringify(doc, (key, value) => (key === "dataUrl" ? "" : value));

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
      } catch {}
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
    capturePhotoBlobs(doc);
    const snapshot = snapshotFor(doc);
    try {
      saveState(doc);
      dirty = false;
      if (!loadCorrupt && !get().storageOk) set({ storageOk: true, storageError: "" });
      if (pendingUndoable && lastCommitted !== null && lastCommitted !== snapshot) {
        undoStack.push(lastCommitted);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        set({ canUndo: true });
      }
      lastCommitted = snapshot;
      pendingUndoable = true;
      pruneBlobs();
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
    if (immediate && dirty) flushSave();
    set({ doc });
    dirty = true;
    pendingUndoable = pendingUndoable && undoable;
    if (immediate) flushSave();
    else scheduleSave();
    if (!undoable) {
      undoStack = [];
      pruneBlobs();
      if (get().canUndo) set({ canUndo: false });
    }
  };

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
      set({
        ready: true,
        doc,
        storageOk: diag.ok && !corrupt,
        storageError: corrupt ? CORRUPT_MESSAGE : diag.error,
        canUndo: false,
      });
    },

    recheckStorage: () => {
      if (dirty) flushSave();
      if (dirty) return;
      const diag = diagnoseStorage();
      set({
        storageOk: diag.ok && !loadCorrupt,
        storageError: loadCorrupt ? CORRUPT_MESSAGE : diag.error,
      });
    },

    undo: () => {
      if (dirty) {
        flushSave();
        if (dirty) return false;
      }
      const prev = undoStack.pop();
      if (prev === undefined) return false;
      const restored = rehydratePhotos(JSON.parse(prev) as AppState);
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
      loadCorrupt = false;
      set({ doc: state, canUndo: false });
      dirty = true;
      pendingUndoable = false;
      flushSave();
    },

    flushPending,

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

    addPage: (type) =>
      commit(
        mapActiveNotebook((nb) => {
          const page = newPage(type, "");
          return { ...nb, pages: [...nb.pages, page], activePageId: page.id };
        }),
        { undoable: false },
      ),

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
        { undoable: false },
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

    addShape: (x, y) =>
      commit(
        mapActivePage((pg) => ({
          ...pg,
          shapes: [...pg.shapes, { id: newId(), text: "", x, y, w: SHAPE_DEFAULT_WIDTH, rot: 0 }],
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
                    : { ...pg, photos: [...pg.photos, { id: newId(), x, y, w: PHOTO_DEFAULT_WIDTH, rot: 0, dataUrl }] },
                ),
              },
        ),
      });
    },

    updatePhoto: (id, patch) =>
      commit(mapActivePage((pg) => ({ ...pg, photos: pg.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))),

    deletePhoto: (id) => commit(mapActivePage((pg) => ({ ...pg, photos: pg.photos.filter((p) => p.id !== id) }))),

    addArrow: (from, to) =>
      commit(
        mapActivePage((pg) => {
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

export function selectCurrentNotebook(s: NotebooksState): Notebook | undefined {
  return s.doc.notebooks.find((n) => n.id === s.doc.activeNotebookId);
}

export function selectCurrentPage(s: NotebooksState): Page | undefined {
  const nb = selectCurrentNotebook(s);
  if (!nb) return undefined;
  return nb.pages.find((p) => p.id === nb.activePageId) ?? nb.pages[0];
}
