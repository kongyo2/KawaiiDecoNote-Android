// トレイに並ぶ順＝ここでの並び順。増やすときは StickerShape の描画も足すこと。
export const STICKER_TYPES = [
  "star",
  "flower",
  "heart",
  "ribbon",
  "sparkle",
  "cloud",
  "moon",
  "crown",
  "butterfly",
  "paw",
  "gem",
] as const;
export type StickerType = (typeof STICKER_TYPES)[number];

export const FRAMES = ["plain", "aurora", "star", "ribbon"] as const;
export type Frame = (typeof FRAMES)[number];

export const RULE_STYLES = ["lines", "grid", "dot", "blank"] as const;
export type RuleStyle = (typeof RULE_STYLES)[number];

export type NotebookType = "profile" | "notestyle";
export type PageType = "flowchart" | "notebook";

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
  // 分岐の中身は「工程カード」だけでなく、入れ子の if 分岐カードも置ける（再帰）。
  branches: { yes: Step[]; no: Step[] };
}

export type Step = NormalStep | IfStep;

export type BranchKey = "yes" | "no";

export const BRANCH_KEYS: readonly BranchKey[] = ["yes", "no"];

export const DEFAULT_BRANCH_LABELS: Record<BranchKey, string> = { yes: "はい", no: "いいえ" };

// ボード上に配置される装飾（ステッカー・テキスト・写真）に共通する配置情報。
export interface Placement {
  id: string;
  x: number;
  y: number;
  rot: number;
}

export interface Sticker extends Placement {
  type: StickerType;
  size: number;
}

export interface Shape extends Placement {
  text: string;
  w: number;
}

export interface Photo extends Placement {
  w: number;
  dataUrl: string;
}

export interface Arrow {
  id: string;
  from: string;
  to: string;
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

// 表紙の色。ラベルは読み上げ・選択状態の説明に使う。
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

export const COLOR_LABELS: Record<string, string> = {
  "#C9B6E4": "ラベンダー",
  "#A8E6CF": "ミント",
  "#E8B4BC": "さくら",
  "#F4D58D": "はちみつ",
  "#B8D8F0": "そら",
  "#D8C4E0": "すみれ",
  "#F0C9A0": "あんず",
  "#CFCFCF": "グレー",
};

// ノート式の用紙色。
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

export const PAPER_COLOR_LABELS: Record<string, string> = {
  "#FFFFFF": "白",
  "#F1F0EE": "オフホワイト",
  "#E4E2DD": "グレージュ",
  "#FBF7F2": "クリーム",
  "#F3E9F7": "うすむらさき",
  "#E6F5EE": "うすみどり",
  "#FCE9EC": "うすもも",
  "#FFF6DE": "うすきいろ",
  "#E7F0FA": "うすあお",
};

export function colorLabel(labels: Record<string, string>, hex: string): string {
  return labels[hex.toUpperCase()] ?? hex;
}

export const DEFAULT_NOTEBOOK_COLOR = PALETTE_COLORS[0];
export const DEFAULT_PAPER_COLOR = PAPER_COLORS[0];
export const DEFAULT_FRAME: Frame = "aurora";
export const DEFAULT_RULE_STYLE: RuleStyle = "lines";

export const STICKER_MIN_SIZE = 20;
export const STICKER_MAX_SIZE = 160;
export const STICKER_DEFAULT_SIZE = 44;

export const SHAPE_MIN_WIDTH = 80;
export const SHAPE_MAX_WIDTH = 420;
export const SHAPE_DEFAULT_WIDTH = 150;

export const PHOTO_MIN_WIDTH = 60;
export const PHOTO_MAX_WIDTH = 420;
export const PHOTO_DEFAULT_WIDTH = 140;

export const ARROW_MIN_LENGTH = 24;
export const ARROW_MAX_LENGTH = 1200;

// 座標・手動矢印がとりうる値の上限（壊れたバックアップを読んだときの防波堤）。
export const MAX_POSITION = 20000;

// 「〜のコピー」を無限に伸ばさないための上限。
export const MAX_NOTEBOOK_NAME = 30;
export const MAX_PAGE_TITLE = 40;
export const MAX_BRANCH_LABEL = 12;
