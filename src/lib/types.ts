export const STICKER_TYPES = ["star", "flower", "heart", "ribbon", "sparkle"] as const;
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

export const STICKER_MIN_SIZE = 20;
export const STICKER_MAX_SIZE = 160;
export const STICKER_DEFAULT_SIZE = 44;

export const SHAPE_MIN_WIDTH = 80;
export const SHAPE_MAX_WIDTH = 420;
export const SHAPE_DEFAULT_WIDTH = 150;

export const PHOTO_MIN_WIDTH = 60;
export const PHOTO_MAX_WIDTH = 420;
export const PHOTO_DEFAULT_WIDTH = 140;
