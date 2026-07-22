import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { NormalStep } from "@/lib/types";
import { Confetti } from "./Confetti";

export function StepCard({ step, index, count }: { step: NormalStep; index: number; count: number }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const toggleStep = useNotebooks((s) => s.toggleStep);
  const moveStep = useNotebooks((s) => s.moveStep);
  const deleteStep = useNotebooks((s) => s.deleteStep);
  const [burst, setBurst] = useState(0);

  const onCheck = () => {
    const nowDone = toggleStep(step.id);
    if (nowDone) setBurst((b) => b + 1);
  };

  return (
    <View style={[styles.card, step.done && styles.cardDone]}>
      <Pressable style={[styles.check, step.done && styles.checkDone]} onPress={onCheck} hitSlop={4}>
        <Text style={[styles.checkMark, step.done && styles.checkMarkDone]}>{step.done ? "✓" : ""}</Text>
      </Pressable>

      <View style={styles.body}>
        <TextInput
          value={step.text}
          onChangeText={(t) => setStepText(step.id, t)}
          multiline
          placeholder="工程を入力…"
          placeholderTextColor="rgba(90,77,112,0.4)"
          style={[styles.text, step.done && styles.textDone]}
        />
        {step.done ? <View style={styles.strike} pointerEvents="none" /> : null}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => moveStep(index, -1)} disabled={index === 0} hitSlop={4}>
          <Text style={[styles.icon, index === 0 && styles.iconHidden]}>▲</Text>
        </Pressable>
        <Pressable onPress={() => moveStep(index, 1)} disabled={index === count - 1} hitSlop={4}>
          <Text style={[styles.icon, index === count - 1 && styles.iconHidden]}>▼</Text>
        </Pressable>
        <Pressable onPress={() => deleteStep(step.id)} hitSlop={4}>
          <Text style={styles.icon}>✕</Text>
        </Pressable>
      </View>

      {burst > 0 ? <Confetti key={burst} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    boxShadow: "0 3px 10px rgba(90,70,110,0.1)",
  },
  cardDone: {
    backgroundColor: "#f4f1e8",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.lavender,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkDone: {
    backgroundColor: colors.lavender,
  },
  checkMark: {
    fontSize: 14,
    color: colors.lavender,
    lineHeight: 16,
  },
  checkMarkDone: {
    color: colors.white,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  textDone: {
    opacity: 0.55,
  },
  strike: {
    position: "absolute",
    left: 0,
    right: 4,
    top: "50%",
    height: 2,
    backgroundColor: colors.rose,
    borderRadius: 2,
  },
  actions: {
    alignItems: "center",
    gap: 2,
  },
  icon: {
    fontSize: 12,
    color: "#b5a8c4",
    paddingVertical: 2,
  },
  iconHidden: {
    opacity: 0,
  },
});
