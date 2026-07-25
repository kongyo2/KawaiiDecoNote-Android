import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Svg, { ClipPath, Defs, G, Line, Path } from "react-native-svg";
import { useSvgId } from "./Gradient";

// ---------------------------------------------------------------------------
// マスキングテープ
// ---------------------------------------------------------------------------
// このアプリの「らしさ」を一手に引き受ける飾り。手帳デコの主役の道具なので、
// 装飾として撒くのではなく《表紙の名前を留める》という役目のある1か所だけで使う。
// 端は少しギザギザに、色は半透明にして、重なると濃くなる本物の質感に寄せている。

const TEAR = 2.2;

function tornPath(w: number, h: number): string {
  const q = h / 4;
  return [
    `M0 0`,
    `L${w} 0`,
    `L${w - TEAR} ${q}`,
    `L${w} ${q * 2}`,
    `L${w - TEAR} ${q * 3}`,
    `L${w} ${h}`,
    `L0 ${h}`,
    `L${TEAR} ${q * 3}`,
    `L0 ${q * 2}`,
    `L${TEAR} ${q}`,
    `Z`,
  ].join(" ");
}

export function WashiTape({
  width,
  height = 20,
  color,
  stripe,
  rotate = -2,
  style,
}: {
  width: number;
  height?: number;
  color: string;
  stripe: string;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const clipId = useSvgId("tape");
  const stripeCount = Math.ceil(width / 9) + 2;

  return (
    <View style={[styles.wrap, { width, height, transform: [{ rotate: `${rotate}deg` }] }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={tornPath(width, height)} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Path d={tornPath(width, height)} fill={color} />
          {Array.from({ length: stripeCount }, (_, i) => {
            const x = i * 9 - height;
            return <Line key={i} x1={x} y1={height} x2={x + height} y2={0} stroke={stripe} strokeWidth={3} />;
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
