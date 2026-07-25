import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, space, text, TRAY_BASE_HEIGHT } from "@/lib/theme";
import { useUi } from "@/state/ui";

export function Toast() {
  const toast = useUi((s) => s.toast);
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  return (
    <View
      style={[styles.holder, { bottom: insets.bottom + TRAY_BASE_HEIGHT + space.md }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
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
    maxWidth: "84%",
    backgroundColor: colors.plum,
    borderRadius: radii.card,
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  text: {
    ...text.label,
    color: colors.white,
    opacity: 0.96,
    textAlign: "center",
  },
});
