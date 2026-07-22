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
import { FRAMES, RULE_STYLES, STICKER_TYPES } from "./types";

/* ---------------- ID採番（Web版 newId 相当） ---------------- */

let uid = 1;

export function newId(): string {
  return `id${uid++}_${Date.now().toString(36)}`;
}

/** 読み込んだデータのID中の数字を見て、採番カウンタを衝突しない位置まで進める */
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

/* ---------------- 生成（Web版 newBoard / newNotebook 相当） ---------------- */

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

/* ---------------- 正規化（未知のJSON→型付きデータ。バックアップ復元用） ---------------- */

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
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
// RN が受け付ける16進色(#rgb/#rgba/#rrggbb/#rrggbbaa)だけ通す。手帳色・用紙色は生成側が
// 常に16進パレットなので、壊れ/手編集バックアップの "ffffff" や "not-a-color" をそのまま
// backgroundColor に渡して不正 ColorValue になるのを防ぎ、既定色へ落とす。
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
    x: num(r.x),
    y: num(r.y),
    rot: num(r.rot),
    size: num(r.size, 44),
  };
}

function normalizeShape(raw: unknown): Shape {
  const r = rec(raw);
  return {
    id: str(r.id) || newId(),
    text: str(r.text),
    x: num(r.x),
    y: num(r.y),
    w: num(r.w, 150),
    rot: num(r.rot),
  };
}

function normalizePhoto(raw: unknown): Photo | null {
  const r = rec(raw);
  const dataUrl = str(r.dataUrl) || str(r.image);
  // 埋め込み画像(data:image/...)だけ受け付ける。オフライン専用アプリなので、細工した
  // バックアップに http(s)/file/content 等の外部URLが混ざっていても、読み込んだ Image が
  // 外部ホストへ取りに行って「ファイルを開いた」ことやIPが漏れるのを防ぐ。
  if (!/^data:image\//i.test(dataUrl)) return null;
  return {
    id: str(r.id) || newId(),
    x: num(r.x),
    y: num(r.y),
    w: num(r.w, 140),
    rot: num(r.rot),
    dataUrl,
  };
}

function normalizeArrow(raw: unknown): Arrow | null {
  const r = rec(raw);
  const from = str(r.from);
  const to = str(r.to);
  if (!from || !to) return null;
  return {
    id: str(r.id) || newId(),
    from,
    to,
    manual: bool(r.manual),
    mx: num(r.mx),
    my: num(r.my),
    length: num(r.length),
    angle: num(r.angle),
  };
}

export function normalizePage(raw: unknown): Page {
  const r = rec(raw);
  return {
    id: str(r.id) || newId(),
    type: oneOf<PageType>(r.type, ["flowchart", "notebook"], "flowchart"),
    title: str(r.title),
    frame: oneOf<Frame>(r.frame, FRAMES, "aurora"),
    sparkleOn: bool(r.sparkleOn),
    steps: list(r.steps).map(normalizeStep),
    stickers: list(r.stickers).map(normalizeSticker),
    note: str(r.note),
    shapes: list(r.shapes).map(normalizeShape),
    photos: list(r.photos)
      .map(normalizePhoto)
      .filter((p): p is Photo => p !== null),
    arrows: list(r.arrows)
      .map(normalizeArrow)
      .filter((a): a is Arrow => a !== null),
    ruleStyle: oneOf<RuleStyle>(r.ruleStyle, RULE_STYLES, "lines"),
    paperColor: hexColor(r.paperColor, "#FBF7F2"),
  };
}

export function normalizeNotebook(raw: unknown): Notebook | null {
  if (!isPlainObject(raw)) return null;
  const r = raw;
  // 本物の手帳は必ずページ(オブジェクト)を1つ以上持つ。ページが無い/中身がプリミティブなら、
  // 空白手帳をでっち上げず null で弾く。壊れ/細工バックアップの {} や 1 を「有効な手帳」に
  // 化けさせ、pickBackup の非空チェックをすり抜けて実データを空手帳で上書きするのを防ぐ。
  const pages = list(r.pages).filter(isPlainObject).map(normalizePage);
  if (pages.length === 0) return null;
  // 旧名 rollbahn → notestyle（Web版の互換処理）
  const rawType = r.type === "rollbahn" ? "notestyle" : r.type;
  const type = oneOf<NotebookType>(rawType, ["profile", "notestyle"], "profile");
  const firstPage = pages[0];
  if (!firstPage) return null;
  let activePageId = str(r.activePageId);
  if (!pages.some((p) => p.id === activePageId)) activePageId = firstPage.id;

  // notestyle は note を shape に移し替える（Web版 loadState と同じ）
  if (type === "notestyle") {
    for (const p of pages) {
      if (p.note.trim()) {
        p.shapes.push({ id: newId(), text: p.note, x: 20, y: 20, w: 150, rot: 0 });
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

export function normalizeState(raw: unknown): AppState {
  const r = rec(raw);
  const notebooks = list(r.notebooks)
    .map(normalizeNotebook)
    .filter((n): n is Notebook => n !== null);
  let activeNotebookId: string | null = typeof r.activeNotebookId === "string" ? r.activeNotebookId : null;
  if (activeNotebookId && !notebooks.some((n) => n.id === activeNotebookId)) {
    activeNotebookId = null;
  }
  const state: AppState = { activeNotebookId, notebooks };
  seedUid(state);
  return state;
}

/** 手帳の表示名（未設定時はタイプ別のプレースホルダ） */
export function notebookDisplayName(nb: Pick<Notebook, "name" | "type">): string {
  if (nb.name) return nb.name;
  return nb.type === "notestyle" ? "無題のノート" : "無題のプロフィール帳";
}

/** ページの表示名 */
export function pageDisplayTitle(pg: Pick<Page, "title">): string {
  return pg.title || "無題のページ";
}
