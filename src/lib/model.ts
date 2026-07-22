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
  RULE_STYLES,
  SHAPE_DEFAULT_WIDTH,
  SHAPE_MAX_WIDTH,
  SHAPE_MIN_WIDTH,
  STICKER_DEFAULT_SIZE,
  STICKER_MAX_SIZE,
  STICKER_MIN_SIZE,
  STICKER_TYPES,
} from "./types";

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
function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num(v, fallback)));
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
    // 0/負値/極端に大きいサイズは、StickerShape の SVG 幅高へそのまま渡ると不正な
    // ネイティブ寸法や巨大描画になる。transform操作と同じ範囲へ丸める。
    size: clampNum(r.size, STICKER_DEFAULT_SIZE, STICKER_MIN_SIZE, STICKER_MAX_SIZE),
  };
}

function normalizeShape(raw: unknown): Shape {
  const r = rec(raw);
  return {
    id: str(r.id) || newId(),
    text: str(r.text),
    x: num(r.x),
    y: num(r.y),
    // 0/負値/極端に大きい幅は、boundsWidth 計測前の初回描画で Transformable がこの値を
    // そのまま使い、不正な寸法や巨大カードになりうる。transform操作と同じ範囲へ丸める。
    w: clampNum(r.w, SHAPE_DEFAULT_WIDTH, SHAPE_MIN_WIDTH, SHAPE_MAX_WIDTH),
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

/** 集合に無ければ登録、有れば重複なので新IDを振り直す（先勝ち）。 */
function uniqueId(seen: Set<string>, obj: { id: string }): void {
  if (seen.has(obj.id)) obj.id = newId();
  seen.add(obj.id);
}

/**
 * 重複IDを振り直す。先に出た方を優先し、後続の重複へ新IDを与える。壊れ/細工バックアップが
 * 同一IDを含むと、React のキーが衝突し、さらに ID一致で動く操作が同IDの要素すべてに及ぶ
 * （例: deletePage は同IDのページを全消し、updateShape は同IDのカードを全更新）。
 * ・手帳IDは全体で、ページIDは手帳内で、ページ内要素IDはページ内かつ種類ごとに一意化する。
 * ・要素は種類ごとに別集合で判定する。矢印が参照する shape ID は先勝ちで最初の出現が保持する
 *   ため、矢印の端点(from/to)は常に実在する shape へ解決でき、張り替えは不要。
 * ・先勝ちなので activeNotebookId / activePageId が指す先（最初の出現）も保たれる。
 */
function dedupeIds(notebooks: Notebook[]): void {
  const seenNb = new Set<string>();
  for (const nb of notebooks) {
    uniqueId(seenNb, nb);
    const seenPg = new Set<string>();
    for (const pg of nb.pages) {
      uniqueId(seenPg, pg);
      const stepIds = new Set<string>();
      const stickerIds = new Set<string>();
      const shapeIds = new Set<string>();
      const photoIds = new Set<string>();
      const arrowIds = new Set<string>();
      for (const st of pg.steps) {
        uniqueId(stepIds, st);
        if (st.type === "if") {
          for (const b of st.branches.yes) uniqueId(stepIds, b);
          for (const b of st.branches.no) uniqueId(stepIds, b);
        }
      }
      for (const s of pg.stickers) uniqueId(stickerIds, s);
      for (const s of pg.shapes) uniqueId(shapeIds, s);
      for (const p of pg.photos) uniqueId(photoIds, p);
      for (const a of pg.arrows) uniqueId(arrowIds, a);
    }
  }
}

export function normalizeState(raw: unknown): AppState {
  const r = rec(raw);
  const notebooks = list(r.notebooks)
    .map(normalizeNotebook)
    .filter((n): n is Notebook => n !== null);
  // 採番カウンタを既存IDの先へ進めてから重複IDを振り直す（新IDが既存と衝突しないように）
  seedUid({ activeNotebookId: null, notebooks });
  dedupeIds(notebooks);
  let activeNotebookId: string | null = typeof r.activeNotebookId === "string" ? r.activeNotebookId : null;
  if (activeNotebookId && !notebooks.some((n) => n.id === activeNotebookId)) {
    activeNotebookId = null;
  }
  return { activeNotebookId, notebooks };
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
