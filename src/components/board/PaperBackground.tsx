import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import type { RuleStyle } from "@/lib/types";

const STROKE = "rgba(155,130,180,0.35)";

export function PaperBackground({ ruleStyle, color }: { ruleStyle: RuleStyle; color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        {ruleStyle === "grid" ? (
          <Pattern id="pat" width={28} height={28} patternUnits="userSpaceOnUse">
            <Rect width={28} height={28} fill={color} />
            <Path d="M0 27.5 H28 M27.5 0 V28" stroke={STROKE} strokeWidth={1} />
          </Pattern>
        ) : ruleStyle === "dot" ? (
          <Pattern id="pat" width={16} height={16} patternUnits="userSpaceOnUse">
            <Rect width={16} height={16} fill={color} />
            <Circle cx={8} cy={8} r={1.2} fill={STROKE} />
          </Pattern>
        ) : ruleStyle === "blank" ? (
          <Pattern id="pat" width={8} height={8} patternUnits="userSpaceOnUse">
            <Rect width={8} height={8} fill={color} />
          </Pattern>
        ) : (
          <Pattern id="pat" width={32} height={32} patternUnits="userSpaceOnUse">
            <Rect width={32} height={32} fill={color} />
            <Path d="M0 31.5 H32" stroke={STROKE} strokeWidth={1} />
          </Pattern>
        )}
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#pat)" />
    </Svg>
  );
}
