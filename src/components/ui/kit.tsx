import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";

/** 半透明の白パネル（Web版の .create-panel / .board 周り） */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
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
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "soft" && styles.btnSoft,
        variant === "dashed" && styles.btnDashed,
        variant === "danger" && styles.btnDanger,
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === "primary" && styles.btnPrimaryText,
          variant === "danger" && styles.btnDangerText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function AppTextInput(props: TextInputProps & { style?: StyleProp<TextStyle> }) {
  const { style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor="rgba(90,77,112,0.4)"
      cursorColor={colors.plum}
      selectionColor="rgba(201,182,228,0.5)"
      {...rest}
      style={[styles.input, props.multiline ? styles.inputMultiline : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelStrong,
    borderRadius: radii.panel,
    padding: 16,
  },
  panelTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.plum,
    marginBottom: 10,
  },
  btn: {
    borderRadius: radii.chip,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.lavender,
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
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  btnPrimaryText: {
    color: colors.white,
  },
  btnDangerText: {
    color: "#c0455c",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.75,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radii.input,
    color: colors.ink,
    fontFamily: fonts.body,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
    lineHeight: 22,
  },
});
