import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { BranchStep, IfStep } from "@/lib/types";

type BranchKey = "yes" | "no";

export function IfCard({ step, index, count }: { step: IfStep; index: number; count: number }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const moveStep = useNotebooks((s) => s.moveStep);
  const deleteStep = useNotebooks((s) => s.deleteStep);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.ifIcon}>🔀もし…</Text>
        <TextInput
          value={step.text}
          onChangeText={(t) => setStepText(step.id, t)}
          multiline
          placeholder="条件を入力…（例：時間があるか？）"
          placeholderTextColor="rgba(90,77,112,0.4)"
          style={styles.cond}
        />
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
      </View>

      <View style={styles.branches}>
        <BranchColumn step={step} branchKey="yes" />
        <BranchColumn step={step} branchKey="no" />
      </View>
    </View>
  );
}

function BranchColumn({ step, branchKey }: { step: IfStep; branchKey: BranchKey }) {
  const setBranchLabel = useNotebooks((s) => s.setBranchLabel);
  const addBranchStep = useNotebooks((s) => s.addBranchStep);

  return (
    <View style={styles.branch}>
      <TextInput
        value={step.labels[branchKey]}
        onChangeText={(t) => setBranchLabel(step.id, branchKey, t)}
        maxLength={12}
        style={styles.branchLabel}
      />
      {step.branches[branchKey].map((b) => (
        <BranchStepRow key={b.id} stepId={step.id} branchKey={branchKey} branch={b} />
      ))}
      <Pressable style={styles.branchAdd} onPress={() => addBranchStep(step.id, branchKey)}>
        <Text style={styles.branchAddText}>＋</Text>
      </Pressable>
    </View>
  );
}

function BranchStepRow({ stepId, branchKey, branch }: { stepId: string; branchKey: BranchKey; branch: BranchStep }) {
  const setBranchStepText = useNotebooks((s) => s.setBranchStepText);
  const toggleBranchStep = useNotebooks((s) => s.toggleBranchStep);
  const deleteBranchStep = useNotebooks((s) => s.deleteBranchStep);

  return (
    <View style={styles.branchStep}>
      <Pressable
        style={[styles.bcheck, branch.done && styles.bcheckDone]}
        onPress={() => toggleBranchStep(stepId, branchKey, branch.id)}
        hitSlop={4}
      >
        <Text style={[styles.bcheckMark, branch.done && styles.bcheckMarkDone]}>{branch.done ? "✓" : ""}</Text>
      </Pressable>
      <TextInput
        value={branch.text}
        onChangeText={(t) => setBranchStepText(stepId, branchKey, branch.id, t)}
        multiline
        placeholder="工程を入力…"
        placeholderTextColor="rgba(90,77,112,0.4)"
        style={[styles.branchText, branch.done && styles.branchTextDone]}
      />
      <Pressable onPress={() => deleteBranchStep(stepId, branchKey, branch.id)} hitSlop={4}>
        <Text style={styles.branchDel}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#fff8ef",
    borderWidth: 1.5,
    borderColor: "#d9a441",
    borderStyle: "dashed",
    borderRadius: radii.card,
    padding: 12,
    boxShadow: "0 3px 10px rgba(90,70,110,0.1)",
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  ifIcon: {
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 3,
  },
  cond: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    padding: 0,
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
  branches: {
    flexDirection: "row",
    gap: 10,
  },
  branch: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  branchLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.plum,
    textAlign: "center",
    padding: 2,
  },
  branchStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    backgroundColor: colors.paper,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    boxShadow: "0 2px 6px rgba(90,70,110,0.08)",
  },
  bcheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lavender,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bcheckDone: {
    backgroundColor: colors.lavender,
  },
  bcheckMark: {
    fontSize: 11,
    color: colors.lavender,
    lineHeight: 13,
  },
  bcheckMarkDone: {
    color: colors.white,
  },
  branchText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    lineHeight: 18,
    padding: 0,
  },
  branchTextDone: {
    opacity: 0.55,
    textDecorationLine: "line-through",
  },
  branchDel: {
    fontSize: 10,
    color: "#b5a8c4",
    paddingTop: 2,
  },
  branchAdd: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(155,130,180,0.4)",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  branchAddText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "#9b7fb8",
  },
});
