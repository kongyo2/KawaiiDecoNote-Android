import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "@/lib/theme";

export function Background({ chic }: { chic: boolean }) {
  const { width, height } = useWindowDimensions();

  if (chic) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.chicBg }]} />;
  }

  const rMax = Math.max(width, height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2={width} y2={height} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.bgTop} />
            <Stop offset="0.5" stopColor={colors.bgMid} />
            <Stop offset="1" stopColor={colors.bgBottom} />
          </LinearGradient>
          <RadialGradient id="lav" cx={width * 0.15} cy={height * 0.1} r={rMax * 0.5} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.lavender} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.lavender} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="mint" cx={width * 0.85} cy={height * 0.2} r={rMax * 0.5} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.mint} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.mint} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="rose" cx={width * 0.5} cy={height * 0.9} r={rMax * 0.55} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.rose} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.rose} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#base)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#lav)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#mint)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#rose)" />
      </Svg>
    </View>
  );
}
