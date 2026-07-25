import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import { colors } from "@/lib/theme";
import type { RuleStyle } from "@/lib/types";
import { useSvgId } from "@/components/ui/Gradient";

// 罫線ごとの1タイル。userSpaceOnUse の Pattern で紙全体に敷き詰める。
const TILE: Record<RuleStyle, { size: number; draw: (stroke: string) => ReactNode }> = {
  grid: {
    size: 28,
    draw: (stroke) => <Path d="M0 27.5 H28 M27.5 0 V28" stroke={stroke} strokeWidth={1} />,
  },
  dot: {
    size: 16,
    draw: (stroke) => <Circle cx={8} cy={8} r={1.2} fill={stroke} />,
  },
  blank: {
    size: 8,
    draw: () => null,
  },
  lines: {
    size: 32,
    draw: (stroke) => <Path d="M0 31.5 H32" stroke={stroke} strokeWidth={1} />,
  },
};

export function PaperBackground({ ruleStyle, color }: { ruleStyle: RuleStyle; color: string }) {
  const id = useSvgId("paper");
  const tile = TILE[ruleStyle];

  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id={id} width={tile.size} height={tile.size} patternUnits="userSpaceOnUse">
          <Rect width={tile.size} height={tile.size} fill={color} />
          {tile.draw(colors.line)}
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
