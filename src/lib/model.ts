import { clamp } from "./format";
import type {
  AppState,
  Arrow,
  BranchKey,
  Frame,
  IfStep,
  NormalStep,
  Notebook,
  NotebookType,
  Page,
  PageType,
  Photo,
  Placement,
  RuleStyle,
  Shape,
  Step,
  Sticker,
  StickerType,
} from "./types";
import {
  DEFAULT_BRANCH_LABELS,
  DEFAULT_FRAME,
  DEFAULT_NOTEBOOK_COLOR,
  DEFAULT_PAPER_COLOR,
  DEFAULT_RULE_STYLE,
  FRAMES,
  MAX_NOTEBOOK_NAME,
  MAX_PAGE_TITLE,
  MAX_POSITION,
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
  const scanStep = (st: Step): void => {
    scan(st.id);
    if (st.type === "if") {
      for (const b of st.branches.yes) scanStep(b);
      for (const b of st.branches.no) scanStep(b);
    }
  };
  for (const nb of state.notebooks) {
    scan(nb.id);
    for (const pg of nb.pages) {
      scan(pg.id);
      for (const st of pg.steps) scanStep(st);
      for (const s of pg.stickers) scan(s.id);
      for (const s of pg.shapes) scan(s.id);
      for (const p of pg.photos) scan(p.id);
      for (const a of pg.arrows) scan(a.id);
    }
  }
  uid = max + 1;
}

// --- ファクトリ ---

export function newPage(type: PageType = "flowchart", title = ""): Page {
  return {
    id: newId(),
    type,
    title,
    frame: DEFAULT_FRAME,
    sparkleOn: false,
    steps: [],
    stickers: [],
    note: "",
    shapes: [],
    photos: [],
    arrows: [],
    ruleStyle: DEFAULT_RULE_STYLE,
    paperColor: DEFAULT_PAPER_COLOR,
  };
}

export function newNotebook(
  type: NotebookType = "profile",
  name = "",
  color: string = DEFAULT_NOTEBOOK_COLOR,
): Notebook {
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
    labels: { ...DEFAULT_BRANCH_LABELS },
    branches: { yes: [], no: [] },
  };
}

// --- 工程ツリー（ネスト対応）を不変更新するための再帰ヘルパー ---

// id が一致する工程を木のどこにあっても探して update を適用し、新しい配列を返す。
export function updateStepInTree(steps: Step[], id: string, update: (s: Step) => Step): Step[] {
  return steps.map((s) => {
    if (s.id === id) return update(s);
    if (s.type === "if") {
      return {
        ...s,
        branches: {
          yes: updateStepInTree(s.branches.yes, id, update),
          no: updateStepInTree(s.branches.no, id, update),
        },
      };
    }
    return s;
  });
}

// id が一致する工程を木のどこにあっても取り除いて、新しい配列を返す。
export function removeStepFromTree(steps: Step[], id: string): Step[] {
  const result: Step[] = [];
  for (const s of steps) {
    if (s.id === id) continue;
    if (s.type === "if") {
      result.push({
        ...s,
        branches: {
          yes: removeStepFromTree(s.branches.yes, id),
          no: removeStepFromTree(s.branches.no, id),
        },
      });
    } else {
      result.push(s);
    }
  }
  return result;
}

// ifId の if 分岐（key 側）の末尾に child を追加した新しい配列を返す。
export function appendToBranch(steps: Step[], ifId: string, key: BranchKey, child: Step): Step[] {
  return updateStepInTree(steps, ifId, (s) =>
    s.type === "if" ? { ...s, branches: { ...s.branches, [key]: [...s.branches[key], child] } } : s,
  );
}

// id の工程を「同じ並びの中で」ひとつ前後に動かす。トップレベルでも分岐の中でも
// 動くので、UI 側は工程が木のどこにあるかを気にしなくていい。
export function moveStepInTree(steps: Step[], id: string, dir: -1 | 1): Step[] {
  const index = steps.findIndex((s) => s.id === id);
  if (index >= 0) {
    const target = index + dir;
    const a = steps[index];
    const b = steps[target];
    if (!a || !b) return steps; // 端にいるので動かせない
    const next = steps.slice();
    next[index] = b;
    next[target] = a;
    return next;
  }
  return steps.map((s) =>
    s.type === "if"
      ? {
          ...s,
          branches: {
            yes: moveStepInTree(s.branches.yes, id, dir),
            no: moveStepInTree(s.branches.no, id, dir),
          },
        }
      : s,
  );
}

// --- 複製（手帳コピー／ページコピー） ---

const COPY_SUFFIX = "のコピー";

// 「〜のコピー」を付ける。入力欄の文字数上限を超えないように元の名前を詰める。
export function copyName(base: string, maxLength: number): string {
  const room = Math.max(0, maxLength - COPY_SUFFIX.length);
  return `${base.length > room ? base.slice(0, room) : base}${COPY_SUFFIX}`;
}

function cloneStep(step: Step): Step {
  if (step.type === "if") {
    return {
      id: newId(),
      type: "if",
      text: step.text,
      done: step.done,
      labels: { ...step.labels },
      branches: { yes: step.branches.yes.map(cloneStep), no: step.branches.no.map(cloneStep) },
    };
  }
  return { ...step, id: newId() };
}

// ページを丸ごと複製する。中の要素にはすべて新しい id を振り、矢印の参照も
// 新しいシェイプ id へ張り替える（元ページと id を共有しないので、あとから
// どちらを編集しても互いに影響しない）。
export function duplicatePage(
  page: Page,
  title: string = page.title ? copyName(page.title, MAX_PAGE_TITLE) : "",
): Page {
  const shapeIds = new Map<string, string>();
  const shapes = page.shapes.map((s) => {
    const id = newId();
    shapeIds.set(s.id, id);
    return { ...s, id };
  });
  return {
    ...page,
    id: newId(),
    title,
    steps: page.steps.map(cloneStep),
    stickers: page.stickers.map((s) => ({ ...s, id: newId() })),
    shapes,
    photos: page.photos.map((p) => ({ ...p, id: newId() })),
    arrows: page.arrows.flatMap((a) => {
      const from = shapeIds.get(a.from);
      const to = shapeIds.get(a.to);
      return from && to ? [{ ...a, id: newId(), from, to }] : [];
    }),
  };
}

// 手帳を丸ごと複製する。開いていたページの位置はコピー先でも引き継ぐ。
export function duplicateNotebook(nb: Notebook): Notebook {
  const activeIndex = nb.pages.findIndex((p) => p.id === nb.activePageId);
  const pages = nb.pages.map((p) => duplicatePage(p, p.title));
  return {
    ...nb,
    id: newId(),
    name: copyName(notebookDisplayName(nb), MAX_NOTEBOOK_NAME),
    pages,
    activePageId: pages[Math.max(0, activeIndex)]?.id ?? nb.activePageId,
  };
}

// --- 取り込み時の正規化 ---
// 端末に保存した JSON も、書き出したバックアップも、必ずここを通してから
// 使う。壊れた値・想定外の型が入っていても既定値に落として読み進める。

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
  return clamp(num(v, fallback), min, max);
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
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function hexColor(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX_COLOR.test(v) ? v : fallback;
}

// 既存の id を採用し、無ければ新規発番する（正規化対象すべてで共通の id 決定ロジック）。
function idOf(r: Record<string, unknown>): string {
  return str(r.id) || newId();
}

function normalizeStep(raw: unknown): Step {
  const r = rec(raw);
  if (r.type === "if") {
    const branches = rec(r.branches);
    const labels = rec(r.labels);
    return {
      id: idOf(r),
      type: "if",
      text: str(r.text),
      done: bool(r.done),
      labels: {
        yes: str(labels.yes, DEFAULT_BRANCH_LABELS.yes),
        no: str(labels.no, DEFAULT_BRANCH_LABELS.no),
      },
      // 分岐の中身も工程として再帰的に正規化する（type なしの分岐工程は type:"step" になる）。
      branches: {
        yes: list(branches.yes).map(normalizeStep),
        no: list(branches.no).map(normalizeStep),
      },
    };
  }
  return { id: idOf(r), type: "step", text: str(r.text), done: bool(r.done) };
}

// ステッカー・シェイプ・写真に共通する配置情報（id と座標・回転）を正規化する。
function normalizePlacement(r: Record<string, unknown>): Placement {
  return {
    id: idOf(r),
    x: clampNum(r.x, 0, 0, MAX_POSITION),
    y: clampNum(r.y, 0, 0, MAX_POSITION),
    rot: num(r.rot),
  };
}

function normalizeSticker(raw: unknown): Sticker {
  const r = rec(raw);
  return {
    ...normalizePlacement(r),
    type: oneOf<StickerType>(r.type, STICKER_TYPES, "star"),
    size: clampNum(r.size, STICKER_DEFAULT_SIZE, STICKER_MIN_SIZE, STICKER_MAX_SIZE),
  };
}

function normalizeShape(raw: unknown): Shape {
  const r = rec(raw);
  return {
    ...normalizePlacement(r),
    text: str(r.text),
    w: clampNum(r.w, SHAPE_DEFAULT_WIDTH, SHAPE_MIN_WIDTH, SHAPE_MAX_WIDTH),
  };
}

function normalizePhoto(raw: unknown): Photo | null {
  const r = rec(raw);
  const dataUrl = str(r.dataUrl);
  if (!/^data:image\//i.test(dataUrl)) return null;
  return {
    ...normalizePlacement(r),
    w: clampNum(r.w, PHOTO_DEFAULT_WIDTH, PHOTO_MIN_WIDTH, PHOTO_MAX_WIDTH),
    dataUrl,
  };
}

function normalizeArrow(raw: unknown): Arrow | null {
  const r = rec(raw);
  const from = str(r.from);
  const to = str(r.to);
  if (!from || !to) return null;
  const id = idOf(r);
  const mx = num(r.mx);
  const my = num(r.my);
  const length = num(r.length);
  const angle = num(r.angle);
  // 保存データ側の上限は MAX_POSITION でゆるく見る（画面上のリサイズ上限
  // ARROW_MAX_LENGTH より広い値が入っていても、位置情報として妥当なら残す）。
  const manualOk =
    bool(r.manual) &&
    length > 0 &&
    length <= MAX_POSITION &&
    Math.abs(mx) <= MAX_POSITION &&
    Math.abs(my) <= MAX_POSITION;
  return manualOk
    ? { id, from, to, manual: true, mx, my, length, angle }
    : { id, from, to, manual: false, mx: 0, my: 0, length: 0, angle: 0 };
}

export function normalizePage(raw: unknown): Page {
  const r = rec(raw);
  const shapes = list(r.shapes).map(normalizeShape);
  const shapeIds = new Set(shapes.map((s) => s.id));
  return {
    id: idOf(r),
    type: oneOf<PageType>(r.type, ["flowchart", "notebook"], "flowchart"),
    title: str(r.title),
    frame: oneOf<Frame>(r.frame, FRAMES, DEFAULT_FRAME),
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
    ruleStyle: oneOf<RuleStyle>(r.ruleStyle, RULE_STYLES, DEFAULT_RULE_STYLE),
    paperColor: hexColor(r.paperColor, DEFAULT_PAPER_COLOR),
  };
}

export function normalizeNotebook(raw: unknown): Notebook | null {
  if (!isPlainObject(raw)) return null;
  const r = raw;
  const pages = list(r.pages).filter(isPlainObject).map(normalizePage);
  const firstPage = pages[0];
  if (!firstPage) return null;
  const type = oneOf<NotebookType>(r.type, ["profile", "notestyle"], "profile");
  let activePageId = str(r.activePageId);
  if (!pages.some((p) => p.id === activePageId)) activePageId = firstPage.id;

  return {
    id: idOf(r),
    name: str(r.name),
    type,
    color: hexColor(r.color, DEFAULT_NOTEBOOK_COLOR),
    activePageId,
    pages,
  };
}

function uniqueId(seen: Set<string>, obj: { id: string }): void {
  if (seen.has(obj.id)) obj.id = newId();
  seen.add(obj.id);
}

function dedupeStep(st: Step, seen: Set<string>): void {
  uniqueId(seen, st);
  if (st.type === "if") {
    for (const b of st.branches.yes) dedupeStep(b, seen);
    for (const b of st.branches.no) dedupeStep(b, seen);
  }
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
      for (const st of pg.steps) dedupeStep(st, stepIds);
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

// --- 表示用ヘルパー ---

export function notebookDisplayName(nb: Pick<Notebook, "name" | "type">): string {
  if (nb.name) return nb.name;
  return nb.type === "notestyle" ? "無題のノート" : "無題のプロフィール帳";
}

export function pageDisplayTitle(pg: Pick<Page, "title">): string {
  return pg.title || "無題のページ";
}

// 工程の進み具合。if分岐の中の工程も数える（分岐カード自体は数えない）。
export function stepProgress(steps: Step[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  const walk = (nodes: Step[]): void => {
    for (const s of nodes) {
      if (s.type === "if") {
        walk(s.branches.yes);
        walk(s.branches.no);
      } else {
        total += 1;
        if (s.done) done += 1;
      }
    }
  };
  walk(steps);
  return { done, total };
}
