import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

// react-native-svg の <Defs> の id はビュー階層で衝突しうるので、
// 同じ画面に複数のグラデーションが出ても混ざらないように毎回ユニーク化する。
export function useSvgId(prefix: string): string {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

// 親いっぱいに斜めのグラデーションを敷く。親側に overflow:"hidden" と
// borderRadius を付けておけば角丸のボタン背景としてそのまま使える。
export function GradientFill({ from, to }: { from: string; to: string }) {
  const id = useSvgId("grad");
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
