import type { ReactElement } from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import type { StickerType } from "@/lib/types";

interface StickerShapeProps {
  type: StickerType;
  size: number;
  c1?: string;
  c2?: string;
}

// シール1種類ぶんの定義。既定色と描画をここにまとめておくと、トレイ・盤面・
// 紙吹雪・飾り枠のどこから呼んでも同じ絵が出る。
interface StickerDef {
  label: string;
  c1: string;
  c2: string;
  draw: (c1: string, c2: string) => ReactElement;
}

const STICKERS: Record<StickerType, StickerDef> = {
  star: {
    label: "星",
    c1: "#F4D58D",
    c2: "#FFFFFF",
    draw: (c1, c2) => (
      <Path
        d="M22 3 L27 16 L41 17 L30 26 L34 40 L22 32 L10 40 L14 26 L3 17 L17 16 Z"
        fill={c1}
        stroke={c2}
        strokeWidth={1.2}
      />
    ),
  },
  flower: {
    label: "花",
    c1: "#E8B4BC",
    c2: "#F4D58D",
    draw: (c1, c2) => (
      <G>
        <Ellipse cx={22} cy={12} rx={7} ry={9} fill={c1} />
        <Ellipse cx={22} cy={32} rx={7} ry={9} fill={c1} />
        <Ellipse cx={12} cy={22} rx={9} ry={7} fill={c1} />
        <Ellipse cx={32} cy={22} rx={9} ry={7} fill={c1} />
        <Ellipse cx={14} cy={14} rx={7} ry={6} fill={c1} opacity={0.9} rotation={-40} originX={14} originY={14} />
        <Ellipse cx={30} cy={14} rx={7} ry={6} fill={c1} opacity={0.9} rotation={40} originX={30} originY={14} />
        <Ellipse cx={14} cy={30} rx={7} ry={6} fill={c1} opacity={0.9} rotation={40} originX={14} originY={30} />
        <Ellipse cx={30} cy={30} rx={7} ry={6} fill={c1} opacity={0.9} rotation={-40} originX={30} originY={30} />
        <Circle cx={22} cy={22} r={6.5} fill={c2} />
      </G>
    ),
  },
  heart: {
    label: "ハート",
    c1: "#E8B4BC",
    c2: "#E8B4BC",
    draw: (c1) => (
      <Path d="M22 38 C6 27 4 16 12 10 C18 6 22 11 22 14 C22 11 26 6 32 10 C40 16 38 27 22 38 Z" fill={c1} />
    ),
  },
  ribbon: {
    label: "リボン",
    c1: "#C9B6E4",
    c2: "#FFF8F2",
    draw: (c1, c2) => (
      <G>
        <Path d="M22 22 C15 15, 4 15, 4 22 C4 29, 15 29, 22 22 Z" fill={c1} />
        <Path d="M22 22 C29 15, 40 15, 40 22 C40 29, 29 29, 22 22 Z" fill={c1} />
        <Circle cx={22} cy={22} r={5.5} fill={c2} stroke={c1} strokeWidth={1.5} />
      </G>
    ),
  },
  sparkle: {
    label: "きらめき",
    c1: "#F4D58D",
    c2: "#F4D58D",
    draw: (c1) => (
      <Path d="M22 2 C23 14 24 20 42 22 C24 24 23 30 22 42 C21 30 20 24 2 22 C20 20 21 14 22 2 Z" fill={c1} />
    ),
  },
  cloud: {
    label: "くも",
    c1: "#FFFFFF",
    c2: "#B8D8F0",
    draw: (c1, c2) => (
      <G>
        <Ellipse cx={14} cy={26} rx={10} ry={8} fill={c1} stroke={c2} strokeWidth={1.2} />
        <Ellipse cx={24} cy={19} rx={12} ry={10} fill={c1} stroke={c2} strokeWidth={1.2} />
        <Ellipse cx={33} cy={27} rx={8} ry={7} fill={c1} stroke={c2} strokeWidth={1.2} />
        <Ellipse cx={22} cy={30} rx={16} ry={8} fill={c1} stroke={c2} strokeWidth={1.2} />
      </G>
    ),
  },
  moon: {
    label: "三日月",
    c1: "#F4D58D",
    c2: "#F4D58D",
    draw: (c1) => (
      <G>
        <Path d="M28 6 C18 6 10 14 10 24 C10 34 18 42 28 42 C20 40 15 33 15 24 C15 15 20 8 28 6 Z" fill={c1} />
        <Path
          d="M35 9 L36.6 13.3 L41 14 L37.7 17 L38.5 21.4 L35 19.1 L31.5 21.4 L32.3 17 L29 14 L33.4 13.3 Z"
          fill={c1}
        />
      </G>
    ),
  },
  crown: {
    label: "王冠",
    c1: "#F4D58D",
    c2: "#E8B4BC",
    draw: (c1, c2) => (
      <G>
        <Path d="M6 30 L9 13 L17 22 L22 9 L27 22 L35 13 L38 30 Z" fill={c1} stroke="#FFFFFF" strokeWidth={1.2} />
        <Rect x={6} y={30} width={32} height={6} rx={2} fill={c1} stroke="#FFFFFF" strokeWidth={1.2} />
        <Circle cx={22} cy={11} r={2.4} fill={c2} />
        <Circle cx={9} cy={15.5} r={2} fill={c2} />
        <Circle cx={35} cy={15.5} r={2} fill={c2} />
      </G>
    ),
  },
  butterfly: {
    label: "ちょうちょ",
    c1: "#C9B6E4",
    c2: "#E8B4BC",
    draw: (c1, c2) => (
      <G>
        <Path d="M22 22 C15 8 2 8 4 20 C5 28 15 26 22 22 Z" fill={c1} />
        <Path d="M22 22 C29 8 42 8 40 20 C39 28 29 26 22 22 Z" fill={c1} />
        <Path d="M22 22 C17 30 8 34 8 40 C8 44 16 42 22 34 Z" fill={c2} />
        <Path d="M22 22 C27 30 36 34 36 40 C36 44 28 42 22 34 Z" fill={c2} />
        <Line x1={22} y1={9} x2={22} y2={36} stroke="#7A6A90" strokeWidth={1.6} />
      </G>
    ),
  },
  paw: {
    label: "にくきゅう",
    c1: "#E8B4BC",
    c2: "#E8B4BC",
    draw: (c1) => (
      <G>
        <Ellipse cx={22} cy={28} rx={11} ry={9} fill={c1} />
        <Ellipse cx={9} cy={17} rx={5} ry={6} fill={c1} />
        <Ellipse cx={19.5} cy={9} rx={5} ry={6.5} fill={c1} />
        <Ellipse cx={30} cy={9} rx={5} ry={6.5} fill={c1} />
        <Ellipse cx={38} cy={17} rx={5} ry={6} fill={c1} />
      </G>
    ),
  },
  gem: {
    label: "宝石",
    c1: "#A8E6CF",
    c2: "#FFFFFF",
    draw: (c1, c2) => (
      <G>
        <Path d="M12 16 L22 6 L32 16 L38 18 L22 40 L6 18 Z" fill={c1} stroke={c2} strokeWidth={1.2} />
        <Path d="M12 16 L32 16 L22 40 Z" fill={c2} opacity={0.35} />
        <Path d="M12 16 L22 6 L32 16" fill="none" stroke={c2} strokeWidth={1} />
      </G>
    ),
  },
};

export function stickerLabel(type: StickerType): string {
  return STICKERS[type].label;
}

export function StickerShape({ type, size, c1, c2 }: StickerShapeProps) {
  const def = STICKERS[type];
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      {def.draw(c1 ?? def.c1, c2 ?? def.c2)}
    </Svg>
  );
}
