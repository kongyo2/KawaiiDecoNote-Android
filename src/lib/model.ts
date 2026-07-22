import type {
  AppState,
  Arrow,
  BranchStep,
  Frame,
  IfStep,
  NormalStep,
  Notebook,
  NotebookType,
  Page,
  PageType,
  Photo,
  RuleStyle,
  Shape,
  Step,
  Sticker,
  StickerType,
} from "./types";
import {
  FRAMES,
  PHOTO_DEFAULT_WIDTH,
  PHOTO_MAX_WIDTH,
  PHOTO_MIN_WIDTH,
  RULE_STYLES,
  SHAPE_DEFAULT_WIDTH,
  SHAPE_MAX_WIDTH,
  SHAPE_MIN_WIDTH,
  STICKER_DEFAULT_SIZE,
  STICKER_MAX_SIZE,
  STICKER_MIN_SIZE,
  STICKER_TYPES,
} from "./types";

let uid = 1;

export function newId(): string {
  return `id${uid++}_${Date.now().toString(36)}`;
}

export function seedUid(state: AppState): void {
  let max = 0;
  const scan = (id: string | undefined): void => {
    if (!id) return;
    const digits = id.replace(/\D/g, "");
    const n = digits ? parseInt(digits, 10) : 0;
    if (Number.isFinite(n)) max = Math.max(max, n);
  };
  for (const nb of state.notebooks) {
    scan(nb.id);
    for (const pg of nb.pages) {
      scan(pg.id);
      for (const st of pg.steps) {
        scan(st.id);
        if (st.type === "if") {
          for (const b of st.branches.yes) scan(b.id);
          for (const b of st.branches.no) scan(b.id);
        }
      }
      for (const s of pg.stickers) scan(s.id);
      for (const s of pg.shapes) scan(s.id);
      for (const p of pg.photos) scan(p.id);
      for (const a of pg.arrows) scan(a.id);
    }
  }
  uid = max + 1;
}

export function newPage(type: PageType = "flowchart", title = ""): Page {
  return {
    id: newId(),
    type,
    title,
    frame: "aurora",
    sparkleOn: false,
    steps: [],
    stickers: [],
    note: "",
    shapes: [],
    photos: [],
    arrows: [],
    ruleStyle: "lines",
    paperColor: "#FFFFFF",
  };
}

export function newNotebook(type: NotebookType = "profile", name = "", color = "#C9B6E4"): Notebook {
  const first = newPage("flowchart", "");
  return { id: newId(), name, type, color, activePageId: first.id, pages: [first] };
}

export function newStep(): NormalStep {
  return { id: newId(), type: "step", text: "", done: false };
}

export function newIfStep(): IfStep {
  return {
    id: newId(),
    type: "if",
    text: "",
    done: false,
    labels: { yes: "はい", no: "いいえ" },
    branches: { yes: [], no: [] },
  };
}

export function newBranchStep(): BranchStep {
  return { id: newId(), text: "", done: false };
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num(v, fallback)));
}

const MAX_POSITION = 20000;
function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function list(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function hexColor(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX_COLOR.test(v) ? v : fallback;
}

function normalizeBranchStep(raw: unknown): BranchStep {
  const r = rec(raw);
  return { id: str(r.id) || newId(), text: str(r.text), done: bool(r.done) };
}

function normalizeStep(raw: unknown): Step {
  const r = rec(raw);
  if (r.type === "if") {
    const branches = rec(r.branches);
    const labels = rec(r.labels);
    return {
      id: str(r.id) || newId(),
      type: "if",
      text: str(r.text),
      done: bool(r.done),
      labels: { yes: str(labels.yes, "はい"), no: str(labels.no, "いいえ") },
      branches: {
        yes: list(branches.yes).map(normalizeBranchStep),
        no: list(branches.no).map(normalizeBranchStep),
      },
    };
  }
  return { id: str(r.id) || newId(), type: "step", text: str(r.text), done: bool(r.done) };
}

function normalizeSticker(raw: unknown): Sticker {
  const r = rec(raw);
  return {
    id: str(r.id) || newId(),
    type: oneOf<StickerType>(r.type, STICKER_TYPES, "star"),
    x: clampNum(r.x, 0, 0, MAX_POSITION),
    y: clampNum(r.y, 0, 0, MAX_POSITION),
    rot: num(r.rot),
    size: clampNum(r.size, STICKER_DEFAULT_SIZE, STICKER_MIN_SIZE, STICKER_MAX_SIZE),
  };
}

function normalizeShape(raw: unknown): Shape {
  const r = rec(raw);
  return {
    id: str(r.id) || newId(),
    text: str(r.text),
    x: clampNum(r.x, 0, 0, MAX_POSITION),
    y: clampNum(r.y, 0, 0, MAX_POSITION),
    w: clampNum(r.w, SHAPE_DEFAULT_WIDTH, SHAPE_MIN_WIDTH, SHAPE_MAX_WIDTH),
    rot: num(r.rot),
  };
}

function normalizePhoto(raw: unknown): Photo | null {
  const r = rec(raw);
  const dataUrl = str(r.dataUrl) || str(r.image);
  if (!/^data:image\//i.test(dataUrl)) return null;
  return {
    id: str(r.id) || newId(),
    x: clampNum(r.x, 0, 0, MAX_POSITION),
    y: clampNum(r.y, 0, 0, MAX_POSITION),
    w: clampNum(r.w, PHOTO_DEFAULT_WIDTH, PHOTO_MIN_WIDTH, PHOTO_MAX_WIDTH),
    rot: num(r.rot),
    dataUrl,
  };
}

const MANUAL_ARROW_MAX = 20000;

function normalizeArrow(raw: unknown): Arrow | null {
  const r = rec(raw);
  const from = str(r.from);
  const to = str(r.to);
  if (!from || !to) return null;
  const id = str(r.id) || newId();
  const mx = num(r.mx);
  const my = num(r.my);
  const length = num(r.length);
  const angle = num(r.angle);
  const manualOk =
    bool(r.manual) &&
    length > 0 &&
    length <= MANUAL_ARROW_MAX &&
    Math.abs(mx) <= MANUAL_ARROW_MAX &&
    Math.abs(my) <= MANUAL_ARROW_MAX;
  return manualOk
    ? { id, from, to, manual: true, mx, my, length, angle }
    : { id, from, to, manual: false, mx: 0, my: 0, length: 0, angle: 0 };
}

export function normalizePage(raw: unknown): Page {
  const r = rec(raw);
  const shapes = list(r.shapes).map(normalizeShape);
  const shapeIds = new Set(shapes.map((s) => s.id));
  return {
    id: str(r.id) || newId(),
    type: oneOf<PageType>(r.type, ["flowchart", "notebook"], "flowchart"),
    title: str(r.title),
    frame: oneOf<Frame>(r.frame, FRAMES, "aurora"),
    sparkleOn: bool(r.sparkleOn),
    steps: list(r.steps).map(normalizeStep),
    stickers: list(r.stickers).map(normalizeSticker),
    note: str(r.note),
    shapes,
    photos: list(r.photos)
      .map(normalizePhoto)
      .filter((p): p is Photo => p !== null),
    arrows: list(r.arrows)
      .map(normalizeArrow)
      .filter((a): a is Arrow => a !== null)
      .filter((a) => shapeIds.has(a.from) && shapeIds.has(a.to)),
    ruleStyle: oneOf<RuleStyle>(r.ruleStyle, RULE_STYLES, "lines"),
    paperColor: hexColor(r.paperColor, "#FBF7F2"),
  };
}

export function normalizeNotebook(raw: unknown): Notebook | null {
  if (!isPlainObject(raw)) return null;
  const r = raw;
  const pages = list(r.pages).filter(isPlainObject).map(normalizePage);
  if (pages.length === 0) return null;
  const rawType = r.type === "rollbahn" ? "notestyle" : r.type;
  const type = oneOf<NotebookType>(rawType, ["profile", "notestyle"], "profile");
  const firstPage = pages[0];
  if (!firstPage) return null;
  let activePageId = str(r.activePageId);
  if (!pages.some((p) => p.id === activePageId)) activePageId = firstPage.id;

  if (type === "notestyle") {
    for (const p of pages) {
      if (p.note.trim()) {
        p.shapes.push({ id: newId(), text: p.note, x: 20, y: 20, w: SHAPE_DEFAULT_WIDTH, rot: 0 });
        p.note = "";
      }
    }
  }

  return {
    id: str(r.id) || newId(),
    name: str(r.name),
    type,
    color: hexColor(r.color, "#C9B6E4"),
    activePageId,
    pages,
  };
}

function uniqueId(seen: Set<string>, obj: { id: string }): void {
  if (seen.has(obj.id)) obj.id = newId();
  seen.add(obj.id);
}

function dedupeIds(notebooks: Notebook[]): void {
  const seenNb = new Set<string>();
  const seenPhoto = new Set<string>();
  for (const nb of notebooks) {
    uniqueId(seenNb, nb);
    const seenPg = new Set<string>();
    for (const pg of nb.pages) {
      uniqueId(seenPg, pg);
      const stepIds = new Set<string>();
      for (const st of pg.steps) {
        uniqueId(stepIds, st);
        if (st.type === "if") {
          for (const b of st.branches.yes) uniqueId(stepIds, b);
          for (const b of st.branches.no) uniqueId(stepIds, b);
        }
      }
      const drawableIds = new Set<string>();
      for (const s of pg.shapes) uniqueId(drawableIds, s);
      for (const p of pg.photos) {
        if (drawableIds.has(p.id) || seenPhoto.has(p.id)) p.id = newId();
        drawableIds.add(p.id);
        seenPhoto.add(p.id);
      }
      for (const s of pg.stickers) uniqueId(drawableIds, s);
      for (const a of pg.arrows) uniqueId(drawableIds, a);
    }
  }
}

export function normalizeState(raw: unknown): AppState {
  const r = rec(raw);
  const notebooks = list(r.notebooks)
    .map(normalizeNotebook)
    .filter((n): n is Notebook => n !== null);
  seedUid({ activeNotebookId: null, notebooks });
  dedupeIds(notebooks);
  let activeNotebookId: string | null = typeof r.activeNotebookId === "string" ? r.activeNotebookId : null;
  if (activeNotebookId && !notebooks.some((n) => n.id === activeNotebookId)) {
    activeNotebookId = null;
  }
  return { activeNotebookId, notebooks };
}

export function notebookDisplayName(nb: Pick<Notebook, "name" | "type">): string {
  if (nb.name) return nb.name;
  return nb.type === "notestyle" ? "無題のノート" : "無題のプロフィール帳";
}

export function pageDisplayTitle(pg: Pick<Page, "title">): string {
  return pg.title || "無題のページ";
}
