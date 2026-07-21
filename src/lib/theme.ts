/** かわいくデコれる手帳 デザイントークン（Web版のCSSカスタムプロパティを移植） */
export const colors = {
  lavender: "#C9B6E4",
  mint: "#A8E6CF",
  rose: "#E8B4BC",
  gold: "#F4D58D",
  plum: "#5b4d70",
  paper: "#FBF7F2",
  ink: "#4A3F5C",

  // 背景グラデーションの基調色
  bgTop: "#f7f2fb",
  bgMid: "#fdf7f3",
  bgBottom: "#f2f9f6",

  // 半透明パネル・境界（Web版の rgba(255,255,255,0.x) 系）
  panel: "rgba(255,255,255,0.55)",
  panelSoft: "rgba(255,255,255,0.35)",
  panelStrong: "rgba(255,255,255,0.7)",
  dashed: "rgba(155,130,180,0.4)",
  dashedStrong: "rgba(155,130,180,0.5)",
  hairline: "rgba(155,130,180,0.3)",
  connector: "rgba(155,130,180,0.55)",
  arrow: "#9b7fb8",
  arrowChic: "#888",

  // notestyle（シック）モード
  chicBg: "#F1F0EE",
  chicInk: "#333",
  chicLine: "#3a3a3a",

  white: "#ffffff",
} as const;

export const fonts = {
  /** 見出し用の手書き風フォント（Yomogi） */
  display: "Yomogi_400Regular",
  /** 本文用の丸ゴシック（M PLUS Rounded 1c） */
  body: "MPLUSRounded1c_400Regular",
  bodyBold: "MPLUSRounded1c_700Bold",
} as const;

export const radii = {
  card: 16,
  panel: 18,
  board: 22,
  chip: 20,
  input: 10,
  small: 8,
  tiny: 6,
} as const;

/** 下部シールトレイのベース高さ（セーフエリアは別途足す） */
export const TRAY_BASE_HEIGHT = 60;
