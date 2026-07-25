import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { chic, colors, HIT_TARGET, radii, shadows, space, text } from "@/lib/theme";
import { GradientFill } from "./Gradient";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PanelTitle({ children }: { children: string }) {
  return <Text style={styles.panelTitle}>{children}</Text>;
}

type ButtonVariant = "primary" | "soft" | "dashed" | "danger";

export function AppButton({
  title,
  onPress,
  variant = "soft",
  disabled = false,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        primary && styles.btnPrimary,
        variant === "soft" && styles.btnSoft,
        variant === "dashed" && styles.btnDashed,
        variant === "danger" && styles.btnDanger,
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      {/* Web版の「ラベンダー→ローズ」のグラデーションボタンを SVG で再現する */}
      {primary ? <GradientFill from={colors.lavender} to={colors.rose} /> : null}
      <Text style={[styles.btnText, primary && styles.btnPrimaryText, variant === "danger" && styles.btnDangerText]}>
        {title}
      </Text>
    </Pressable>
  );
}

// 絵文字ひとつだけの丸ボタン。見た目が小さくてもタップ判定は最低 32dp を確保し、
// 読み上げ用のラベルを必ず要求する。
export function IconButton({
  icon,
  label,
  onPress,
  size = HIT_TARGET,
  tone = "veil",
  tint,
  disabled = false,
  style,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  size?: number;
  tone?: "veil" | "rose" | "plain";
  // 絵文字そのものの色。ノート式の落ち着いた画面では墨色に寄せる。
  tint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        tone === "veil" && styles.iconBtnVeil,
        tone === "rose" && styles.iconBtnRose,
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <Text style={[styles.iconBtnText, tone === "rose" && styles.iconBtnRoseText, tint ? { color: tint } : null]}>
        {icon}
      </Text>
    </Pressable>
  );
}

// 選択状態を持つ小さなチップ（飾り枠・罫線などの切り替え）。
export function Chip({
  label,
  active,
  onPress,
  chicMode = false,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  chicMode?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        chicMode ? styles.chipChic : null,
        active ? (chicMode ? styles.chipChicActive : styles.chipActive) : null,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          chicMode ? styles.chipTextChic : null,
          active ? styles.chipTextActive : null,
          active && chicMode ? styles.chipTextChicActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AppTextInput(props: TextInputProps & { style?: StyleProp<TextStyle> }) {
  const { style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      cursorColor={colors.plum}
      selectionColor={colors.selection}
      {...rest}
      style={[styles.input, props.multiline ? styles.inputMultiline : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.veilStrong,
    borderRadius: radii.panel,
    padding: space.lg,
  },
  panelTitle: {
    ...text.displayS,
    color: colors.plum,
    marginBottom: space.sm,
  },
  btn: {
    borderRadius: radii.pill,
    paddingVertical: 11,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  btnPrimary: {
    backgroundColor: colors.lavender,
    boxShadow: shadows.chip,
  },
  btnSoft: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  btnDashed: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.dashedStrong,
    borderStyle: "dashed",
  },
  btnDanger: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "rgba(226,83,107,0.4)",
  },
  btnText: {
    ...text.bodyBold,
    color: colors.ink,
  },
  btnPrimaryText: {
    color: colors.white,
  },
  btnDangerText: {
    color: colors.roseDeep,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.75,
  },
  iconBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnVeil: {
    backgroundColor: colors.veil,
  },
  iconBtnRose: {
    backgroundColor: colors.rose,
  },
  iconBtnText: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.plum,
  },
  iconBtnRoseText: {
    color: colors.white,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.veil,
  },
  chipActive: {
    backgroundColor: colors.white,
    borderColor: colors.lavender,
    boxShadow: shadows.chip,
  },
  chipChic: {
    backgroundColor: chic.card,
    borderColor: chic.border,
    borderRadius: radii.tiny,
  },
  chipChicActive: {
    backgroundColor: "#EEEEEE",
    borderColor: chic.rule,
  },
  chipText: {
    ...text.label,
    color: colors.ink,
  },
  chipTextActive: {
    ...text.labelBold,
  },
  chipTextChic: {
    color: chic.inkSoft,
  },
  chipTextChicActive: {
    color: chic.ink,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radii.small,
    color: colors.ink,
    ...text.bodyL,
    paddingVertical: 9,
    paddingHorizontal: space.md,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
});
