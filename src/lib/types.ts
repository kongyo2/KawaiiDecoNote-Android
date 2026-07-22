/**
 * データモデル。オリジナル Web版（pppzet/KawaiiDecoNote index.html）の
 * state 構造をそのまま TypeScript に写したもの。
 * バックアップJSONの互換のため、キー名も Web版に合わせている。
 *
 *   AppState
 *     └ Notebook（手帳）        type: profile | notestyle
 *         └ Page（ページ／盤面） type: flowchart | notebook
 *             ├ Step[]          工程（通常 or if分岐）
 *             ├ Sticker[]       シール
 *             ├ Shape[]         フリーテキストカード（notestyle）
 *             ├ Photo[]         写真（notestyle）
 *             └ Arrow[]         つなぎ線（notestyle）
 */

export const STICKER_TYPES = ["star", "flower", "heart", "ribbon", "sparkle"] as const;
export type StickerType = (typeof STICKER_TYPES)[number];

export const FRAMES = ["plain", "aurora", "star", "ribbon"] as const;
export type Frame = (typeof FRAMES)[number];

export const RULE_STYLES = ["lines", "grid", "dot", "blank"] as const;
export type RuleStyle = (typeof RULE_STYLES)[number];

export type NotebookType = "profile" | "notestyle";
export type PageType = "flowchart" | "notebook";

export interface BranchStep {
  id: string;
  text: string;
  done: boolean;
}

export interface NormalStep {
  id: string;
  type: "step";
  text: string;
  done: boolean;
}

export interface IfStep {
  id: string;
  type: "if";
  text: string;
  done: boolean;
  labels: { yes: string; no: string };
  branches: { yes: BranchStep[]; no: BranchStep[] };
}

export type Step = NormalStep | IfStep;

export interface Sticker {
  id: string;
  type: StickerType;
  x: number;
  y: number;
  rot: number;
  size: number;
}

export interface Shape {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  rot: number;
}

export interface Photo {
  id: string;
  x: number;
  y: number;
  w: number;
  rot: number;
  /** data:image/...;base64,... （Web版と同じ埋め込み方式） */
  dataUrl: string;
}

export interface Arrow {
  id: string;
  from: string;
  to: string;
  /** 手動で位置・角度・長さを動かしたか。false なら from/to の中心から自動計算 */
  manual: boolean;
  mx: number;
  my: number;
  length: number;
  angle: number;
}

export interface Page {
  id: string;
  type: PageType;
  title: string;
  frame: Frame;
  sparkleOn: boolean;
  steps: Step[];
  stickers: Sticker[];
  note: string;
  shapes: Shape[];
  photos: Photo[];
  arrows: Arrow[];
  ruleStyle: RuleStyle;
  paperColor: string;
}

export interface Notebook {
  id: string;
  name: string;
  type: NotebookType;
  color: string;
  activePageId: string;
  pages: Page[];
}

export interface AppState {
  activeNotebookId: string | null;
  notebooks: Notebook[];
}

/** 手帳の表紙で選べるパステルカラー（Web版 paletteColors と同じ） */
export const PALETTE_COLORS = [
  "#C9B6E4",
  "#A8E6CF",
  "#E8B4BC",
  "#F4D58D",
  "#B8D8F0",
  "#D8C4E0",
  "#F0C9A0",
  "#CFCFCF",
] as const;

/** notestyle ページの用紙色（Web版 paperSwatches と同じ） */
export const PAPER_COLORS = [
  "#FFFFFF",
  "#F1F0EE",
  "#E4E2DD",
  "#FBF7F2",
  "#F3E9F7",
  "#E6F5EE",
  "#FCE9EC",
  "#FFF6DE",
  "#E7F0FA",
] as const;

/** シールの一辺(px)。transform操作(StickerItem)の下限/上限と、取り込み正規化の
 *  クランプで共有し、両者の範囲がズレないようにする。 */
export const STICKER_MIN_SIZE = 20;
export const STICKER_MAX_SIZE = 160;
export const STICKER_DEFAULT_SIZE = 44;

/** フリーテキストの幅(px)。transform操作(ShapeCard)の下限/上限と、取り込み正規化の
 *  クランプで共有する。 */
export const SHAPE_MIN_WIDTH = 80;
export const SHAPE_MAX_WIDTH = 420;
export const SHAPE_DEFAULT_WIDTH = 150;

/** 写真の幅(px)。transform操作(PhotoCard)の下限/上限と、取り込み正規化のクランプで共有する。 */
export const PHOTO_MIN_WIDTH = 60;
export const PHOTO_MAX_WIDTH = 420;
export const PHOTO_DEFAULT_WIDTH = 140;
