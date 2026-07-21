import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/lib/theme";
import { useUi } from "@/state/ui";

/** 画面下にそっと出るトースト（Web版の .toast） */
export function Toast() {
  const toast = useUi((s) => s.toast);
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  return (
    <View style={[styles.holder, { bottom: insets.bottom + 90 }]} pointerEvents="none">
      <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(220)} style={styles.toast}>
        <Text style={styles.text}>{toast}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  holder: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 300,
  },
  toast: {
    maxWidth: "80%",
    backgroundColor: colors.plum,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  text: {
    color: colors.white,
    opacity: 0.96,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
});
