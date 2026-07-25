import type { TextStyle } from "react-native";

// ---------------------------------------------------------------------------
// パレット
// ---------------------------------------------------------------------------
// Web版オリジナル（index.html の :root）の6色を出発点に、コンポーネント側へ
// 散らばっていた生の色リテラル（#555 / #b5a8c4 / rgba(155,130,180,.4) など）を
// すべてここへ集約している。色を足すときは必ずこの表に名前を付けてから使う。

export const palette = {
  lavender: "#C9B6E4",
  lavenderDeep: "#9B7FB8",
  mint: "#A8E6CF",
  rose: "#E8B4BC",
  roseDeep: "#C0455C",
  gold: "#F4D58D",
  amber: "#D9A441",
  plum: "#5B4D70",
  ink: "#4A3F5C",
  inkSoft: "#B5A8C4",
  paper: "#FBF7F2",
  white: "#FFFFFF",
} as const;

// 半透明の白＝「トレーシングペーパーを重ねた」層。数値が上がるほど不透明。
const veil = {
  weak: "rgba(255,255,255,0.35)",
  base: "rgba(255,255,255,0.55)",
  strong: "rgba(255,255,255,0.72)",
  solid: "rgba(255,255,255,0.92)",
} as const;

// ラベンダーの薄墨。罫線・破線・影のトーンをここで一本化する。
const mist = {
  hairline: "rgba(155,130,180,0.25)",
  line: "rgba(155,130,180,0.35)",
  dashed: "rgba(155,130,180,0.4)",
  dashedStrong: "rgba(155,130,180,0.5)",
  arrow: "rgba(155,130,180,0.55)",
} as const;

export const colors = {
  ...palette,

  // 背景グラデーション（Web版の body background を3点で再現）
  bgTop: "#F7F2FB",
  bgMid: "#FDF7F3",
  bgBottom: "#F2F9F6",

  veilWeak: veil.weak,
  veil: veil.base,
  veilStrong: veil.strong,
  veilSolid: veil.solid,

  hairline: mist.hairline,
  line: mist.line,
  dashed: mist.dashed,
  dashedStrong: mist.dashedStrong,
  connector: mist.arrow,

  // 入力プレースホルダ／カーソル
  placeholder: "rgba(90,77,112,0.4)",
  selection: "rgba(201,182,228,0.5)",

  // 保存できないときの警告バナー（唯一の暖色系アラート）
  warnBg: "#FFF3E0",
  warnBorder: "#F0B86E",
  warnInk: "#7A4A12",

  // if分岐カードはネストの深さで3色に切り替わる（Web版と同じ配色）
  ifCard: { bg: "#FFF8EF", border: palette.amber },
  ifCardNest1: { bg: "#FAF5FF", border: "#C9A0D9" },
  ifCardNest2: { bg: "#F2F8FF", border: "#A3C9E0" },
  stepDone: "#F4F1E8",
} as const;

// ノート式（notestyle）の落ち着いた無彩色テーマ。Web版の .notestyle-mode 相当。
export const chic = {
  bg: "#F1F0EE",
  ink: "#333333",
  inkSoft: "#777777",
  rule: "#3A3A3A",
  border: "#DDDDDD",
  borderSoft: "#EEEEEE",
  handle: "#555555",
  arrow: "#888888",
  card: "#FFFFFF",
} as const;

// ---------------------------------------------------------------------------
// タイポグラフィ
// ---------------------------------------------------------------------------
// 手書き風の Yomogi を「見出しと余白の言葉」だけに絞り、本文は M PLUS Rounded 1c
// に任せる。Yomogi を使い過ぎると全体が読みづらくなるので、使い所は下の
// display* / handwritten だけに限定する。

export const fonts = {
  display: "Yomogi_400Regular",
  body: "MPLUSRounded1c_400Regular",
  bodyBold: "MPLUSRounded1c_700Bold",
} as const;

const face = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
});

export const text = {
  displayL: face(fonts.display, 26, 34),
  displayM: face(fonts.display, 20, 28),
  displayS: face(fonts.display, 16, 24),
  handwritten: face(fonts.display, 15, 24),

  bodyL: face(fonts.body, 15, 22),
  body: face(fonts.body, 13.5, 20),
  bodyBold: face(fonts.bodyBold, 13.5, 20),
  label: face(fonts.body, 12, 18),
  labelBold: face(fonts.bodyBold, 12, 18),
  caption: face(fonts.body, 11, 16),
  micro: face(fonts.body, 10, 14),
} as const;

// ---------------------------------------------------------------------------
// 余白・角丸・影
// ---------------------------------------------------------------------------

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

export const radii = {
  tiny: 6,
  small: 10,
  card: 16,
  panel: 18,
  board: 22,
  pill: 24,
} as const;

export const shadows = {
  card: "0 3px 10px rgba(90,70,110,0.10)",
  raised: "0 4px 14px rgba(90,70,110,0.18)",
  chip: "0 2px 8px rgba(155,130,180,0.20)",
  glow: "0 0 40px rgba(201,182,228,0.35)",
  handle: "0 2px 6px rgba(0,0,0,0.25)",
  chicCard: "0 1px 5px rgba(0,0,0,0.10)",
  chicBoard: "0 1px 4px rgba(0,0,0,0.08)",
} as const;

// タップ領域の下限（Android のガイドラインは 48dp だが、装飾ボタンは
// hitSlop で補うので見た目のサイズはこの値を最低ラインにする）。
export const HIT_TARGET = 32;

// 下部ツールバーの高さ（セーフエリアを除いた分）。画面側の余白計算に使う。
export const TRAY_BASE_HEIGHT = 64;
