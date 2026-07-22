import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { IfStep, NormalStep } from "@/lib/types";

type BranchKey = "yes" | "no";

// 最上位（cb.steps 直下）の if 分岐カード。上下移動・削除ボタン付き。
export function IfCard({ step, index, count }: { step: IfStep; index: number; count: number }) {
  const deleteStep = useNotebooks((s) => s.deleteStep);
  return <IfCardNode step={step} depth={0} onDelete={() => deleteStep(step.id)} move={{ index, count }} />;
}

// if 分岐カードの共通描画（トップレベルでも分岐の中＝ネストでも使う再帰対応版）。
function IfCardNode({
  step,
  depth,
  onDelete,
  move,
}: {
  step: IfStep;
  depth: number;
  onDelete: () => void;
  move?: { index: number; count: number };
}) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const moveStep = useNotebooks((s) => s.moveStep);

  return (
    <View
      style={[
        styles.card,
        depth === 0 ? styles.cardTop : styles.cardNested,
        depth === 1 && styles.cardNest1,
        depth >= 2 && styles.cardNest2,
      ]}
    >
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
          {move ? (
            <>
              <Pressable onPress={() => moveStep(move.index, -1)} disabled={move.index === 0} hitSlop={4}>
                <Text style={[styles.icon, move.index === 0 && styles.iconHidden]}>▲</Text>
              </Pressable>
              <Pressable onPress={() => moveStep(move.index, 1)} disabled={move.index === move.count - 1} hitSlop={4}>
                <Text style={[styles.icon, move.index === move.count - 1 && styles.iconHidden]}>▼</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable onPress={onDelete} hitSlop={4}>
            <Text style={styles.icon}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.branches}>
        <BranchColumn step={step} branchKey="yes" depth={depth} />
        <BranchColumn step={step} branchKey="no" depth={depth} />
      </View>
    </View>
  );
}

function BranchColumn({ step, branchKey, depth }: { step: IfStep; branchKey: BranchKey; depth: number }) {
  const setBranchLabel = useNotebooks((s) => s.setBranchLabel);
  const addBranchStep = useNotebooks((s) => s.addBranchStep);
  const addBranchIfStep = useNotebooks((s) => s.addBranchIfStep);

  return (
    <View style={styles.branch}>
      <TextInput
        value={step.labels[branchKey]}
        onChangeText={(t) => setBranchLabel(step.id, branchKey, t)}
        maxLength={12}
        style={styles.branchLabel}
      />
      {/* 分岐の中身は「工程カード」か「入れ子 if 分岐カード」のどちらか */}
      {step.branches[branchKey].map((item) =>
        item.type === "if" ? (
          <NestedIfItem key={item.id} step={item} depth={depth + 1} />
        ) : (
          <BranchStepRow key={item.id} branch={item} />
        ),
      )}
      <View style={styles.branchAddRow}>
        <Pressable style={styles.branchAdd} onPress={() => addBranchStep(step.id, branchKey)}>
          <Text style={styles.branchAddText}>＋工程</Text>
        </Pressable>
        <Pressable style={styles.branchAdd} onPress={() => addBranchIfStep(step.id, branchKey)}>
          <Text style={styles.branchAddText}>＋🔀if</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NestedIfItem({ step, depth }: { step: IfStep; depth: number }) {
  const deleteStep = useNotebooks((s) => s.deleteStep);
  return (
    <View style={styles.nestedIfWrap}>
      <IfCardNode step={step} depth={depth} onDelete={() => deleteStep(step.id)} />
    </View>
  );
}

function BranchStepRow({ branch }: { branch: NormalStep }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const toggleStep = useNotebooks((s) => s.toggleStep);
  const deleteStep = useNotebooks((s) => s.deleteStep);

  return (
    <View style={styles.branchStep}>
      <Pressable
        style={[styles.bcheck, branch.done && styles.bcheckDone]}
        onPress={() => toggleStep(branch.id)}
        hitSlop={4}
      >
        <Text style={[styles.bcheckMark, branch.done && styles.bcheckMarkDone]}>{branch.done ? "✓" : ""}</Text>
      </Pressable>
      <TextInput
        value={branch.text}
        onChangeText={(t) => setStepText(branch.id, t)}
        multiline
        placeholder="工程を入力…"
        placeholderTextColor="rgba(90,77,112,0.4)"
        style={[styles.branchText, branch.done && styles.branchTextDone]}
      />
      <Pressable onPress={() => deleteStep(branch.id)} hitSlop={4}>
        <Text style={styles.branchDel}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff8ef",
    borderWidth: 1.5,
    borderColor: "#d9a441",
    borderStyle: "dashed",
    borderRadius: radii.card,
    padding: 12,
    boxShadow: "0 3px 10px rgba(90,70,110,0.1)",
  },
  cardTop: {
    maxWidth: 420,
    alignSelf: "center",
  },
  cardNested: {
    padding: 10,
  },
  cardNest1: {
    backgroundColor: "#faf5ff",
    borderColor: "#c9a0d9",
  },
  cardNest2: {
    backgroundColor: "#f2f8ff",
    borderColor: "#a3c9e0",
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
  // スマホ幅では「はい／いいえ」を縦積みにして、ネストが深くても横幅で潰れないようにする。
  branches: {
    gap: 10,
  },
  branch: {
    width: "100%",
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
  nestedIfWrap: {
    marginVertical: 2,
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
  branchAddRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  branchAdd: {
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
