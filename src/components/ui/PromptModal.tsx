import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { AppButton, AppTextInput } from "./kit";

export function PromptModal({
  visible,
  title,
  initialValue,
  placeholder,
  maxLength,
  submitLabel = "決定",
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  placeholder?: string;
  maxLength?: number;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <AppTextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder ?? ""}
            {...(maxLength !== undefined ? { maxLength } : {})}
            autoFocus
            style={styles.input}
          />
          <View style={styles.row}>
            <AppButton title="やめる" variant="soft" onPress={onCancel} style={styles.flex} />
            <AppButton
              title={submitLabel}
              variant="primary"
              onPress={() => onSubmit(value.trim())}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(74,63,92,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.paper,
    borderRadius: radii.panel,
    padding: 18,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.plum,
    marginBottom: 12,
  },
  input: {
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
});
