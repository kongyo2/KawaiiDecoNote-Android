import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { successFeedback } from "@/lib/haptics";
import { colors, radii, shadows, space, text } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import type { NormalStep } from "@/lib/types";
import { Confetti } from "./Confetti";
import { StepActions } from "./StepActions";

export function StepCard({ step, index, count }: { step: NormalStep; index: number; count: number }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const toggleStep = useNotebooks((s) => s.toggleStep);
  const deleteStep = useNotebooks((s) => s.deleteStep);
  const focusId = useUi((s) => s.focusId);
  const setFocus = useUi((s) => s.setFocus);
  const [burst, setBurst] = useState(0);

  const onCheck = () => {
    const nowDone = toggleStep(step.id);
    if (nowDone) {
      setBurst((b) => b + 1);
      successFeedback();
    }
  };

  const label = step.text.trim() || "空の工程";

  return (
    <View style={[styles.card, step.done && styles.cardDone]}>
      <Pressable
        style={[styles.check, step.done && styles.checkDone]}
        onPress={onCheck}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done }}
        accessibilityLabel={label}
      >
        <Text style={[styles.checkMark, step.done && styles.checkMarkDone]}>{step.done ? "✓" : ""}</Text>
      </Pressable>

      <View style={styles.body}>
        <TextInput
          value={step.text}
          onChangeText={(t) => setStepText(step.id, t)}
          multiline
          placeholder="工程を入力…"
          placeholderTextColor={colors.placeholder}
          autoFocus={focusId === step.id}
          onFocus={() => focusId === step.id && setFocus(null)}
          accessibilityLabel="工程の内容"
          style={[styles.text, step.done && styles.textDone]}
        />
        {step.done ? <View style={styles.strike} pointerEvents="none" /> : null}
      </View>

      <StepActions
        stepId={step.id}
        isFirst={index === 0}
        isLast={index === count - 1}
        onDelete={() => deleteStep(step.id)}
      />

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
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.sm,
    boxShadow: shadows.card,
  },
  cardDone: {
    backgroundColor: colors.stepDone,
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
    ...text.bodyL,
    color: colors.ink,
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
});
