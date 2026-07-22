import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import type { StickerType } from "@/lib/types";

interface StickerShapeProps {
  type: StickerType;
  size: number;
  c1?: string;
  c2?: string;
}

const DEFAULTS: Record<StickerType, { c1: string; c2: string }> = {
  star: { c1: "#F4D58D", c2: "#ffffff" },
  flower: { c1: "#E8B4BC", c2: "#F4D58D" },
  heart: { c1: "#E8B4BC", c2: "#E8B4BC" },
  ribbon: { c1: "#C9B6E4", c2: "#fff8f2" },
  sparkle: { c1: "#F4D58D", c2: "#F4D58D" },
};

export function StickerShape({ type, size, c1, c2 }: StickerShapeProps) {
  const d = DEFAULTS[type];
  const fill = c1 ?? d.c1;
  const accent = c2 ?? d.c2;

  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      {type === "star" ? (
        <Path
          d="M22 3 L27 16 L41 17 L30 26 L34 40 L22 32 L10 40 L14 26 L3 17 L17 16 Z"
          fill={fill}
          stroke={accent}
          strokeWidth={1.2}
        />
      ) : null}

      {type === "flower" ? (
        <G>
          <Ellipse cx={22} cy={12} rx={7} ry={9} fill={fill} />
          <Ellipse cx={22} cy={32} rx={7} ry={9} fill={fill} />
          <Ellipse cx={12} cy={22} rx={9} ry={7} fill={fill} />
          <Ellipse cx={32} cy={22} rx={9} ry={7} fill={fill} />
          <Ellipse cx={14} cy={14} rx={7} ry={6} fill={fill} opacity={0.9} rotation={-40} originX={14} originY={14} />
          <Ellipse cx={30} cy={14} rx={7} ry={6} fill={fill} opacity={0.9} rotation={40} originX={30} originY={14} />
          <Ellipse cx={14} cy={30} rx={7} ry={6} fill={fill} opacity={0.9} rotation={40} originX={14} originY={30} />
          <Ellipse cx={30} cy={30} rx={7} ry={6} fill={fill} opacity={0.9} rotation={-40} originX={30} originY={30} />
          <Circle cx={22} cy={22} r={6.5} fill={accent} />
        </G>
      ) : null}

      {type === "heart" ? (
        <Path d="M22 38 C6 27 4 16 12 10 C18 6 22 11 22 14 C22 11 26 6 32 10 C40 16 38 27 22 38 Z" fill={fill} />
      ) : null}

      {type === "ribbon" ? (
        <G>
          <Path d="M22 22 C15 15, 4 15, 4 22 C4 29, 15 29, 22 22 Z" fill={fill} />
          <Path d="M22 22 C29 15, 40 15, 40 22 C40 29, 29 29, 22 22 Z" fill={fill} />
          <Circle cx={22} cy={22} r={5.5} fill={accent} stroke={fill} strokeWidth={1.5} />
        </G>
      ) : null}

      {type === "sparkle" ? (
        <Path d="M22 2 C23 14 24 20 42 22 C24 24 23 30 22 42 C21 30 20 24 2 22 C20 20 21 14 22 2 Z" fill={fill} />
      ) : null}
    </Svg>
  );
}
