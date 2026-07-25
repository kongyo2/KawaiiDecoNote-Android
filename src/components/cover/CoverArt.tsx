import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { darken, isLightColor, lighten } from "@/lib/color";
import { colors, radii, shadows, space, text } from "@/lib/theme";
import type { NotebookType } from "@/lib/types";
import { GradientFill } from "@/components/ui/Gradient";
import { WashiTape } from "@/components/ui/WashiTape";

const TAPE_WIDTH = 62;
const TAPE_HEIGHT = 16;

export const COVER_ASPECT = 3 / 4;

// 手帳の「表紙」そのもの。一覧のカードと、作成パネルのプレビューで共有する。
// 背表紙・マスキングテープ・貼りラベルの3点セットが、この画面の目印。
export function CoverArt({
  name,
  type,
  color,
  pageCount,
  bottomInset = 0,
  style,
}: {
  name: string;
  type: NotebookType;
  color: string;
  pageCount: number;
  // 下端にボタン帯を重ねるとき、その高さぶん中身を持ち上げる。
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const ink = isLightColor(color) ? colors.plum : colors.white;

  return (
    <View style={[styles.cover, style]}>
      <GradientFill from={lighten(color, 0.24)} to={darken(color, 0.08)} />
      <View style={[styles.spine, { backgroundColor: darken(color, 0.16) }]} />
      <View style={styles.spineHighlight} />

      <View style={[styles.inner, { paddingBottom: space.sm + bottomInset }]}>
        <Text style={styles.badge}>{type === "notestyle" ? "📓" : "📔"}</Text>

        <View style={styles.labelHolder}>
          <View style={styles.label}>
            <Text style={styles.labelText} numberOfLines={3}>
              {name}
            </Text>
          </View>
          <WashiTape
            width={TAPE_WIDTH}
            height={TAPE_HEIGHT}
            color="rgba(255,255,255,0.60)"
            stripe="rgba(255,255,255,0.88)"
            rotate={-4}
            style={styles.tape}
          />
        </View>

        <Text style={[styles.meta, { color: ink }]}>{pageCount}ページ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  // 表紙の左端の背表紙。これがあるだけで「色板」ではなく「本」に見える。
  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 11,
  },
  spineHighlight: {
    position: "absolute",
    left: 11,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  inner: {
    flex: 1,
    paddingTop: space.sm,
    paddingLeft: 20,
    paddingRight: space.sm,
  },
  badge: {
    fontSize: 17,
    lineHeight: 22,
  },
  labelHolder: {
    flex: 1,
    justifyContent: "center",
    paddingTop: space.sm,
  },
  // 表紙に貼った名前ラベル。マステで留まっているように見せる。
  label: {
    backgroundColor: colors.paper,
    borderRadius: radii.tiny,
    paddingVertical: 7,
    paddingHorizontal: space.sm,
    boxShadow: shadows.card,
  },
  labelText: {
    ...text.handwritten,
    color: colors.plum,
    textAlign: "center",
  },
  tape: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -TAPE_WIDTH / 2,
  },
  meta: {
    ...text.micro,
    opacity: 0.85,
  },
});
