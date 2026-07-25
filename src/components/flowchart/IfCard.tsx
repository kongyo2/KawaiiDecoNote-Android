import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { successFeedback } from "@/lib/haptics";
import { colors, radii, shadows, space, text } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import { BRANCH_KEYS, MAX_BRANCH_LABEL } from "@/lib/types";
import type { BranchKey, IfStep, NormalStep, Step } from "@/lib/types";
import { StepActions } from "./StepActions";

interface Position {
  isFirst: boolean;
  isLast: boolean;
}

// 最上位（page.steps 直下）の if 分岐カード。
export function IfCard({ step, index, count }: { step: IfStep; index: number; count: number }) {
  return <IfCardNode step={step} depth={0} position={{ isFirst: index === 0, isLast: index === count - 1 }} />;
}

// if 分岐カードの共通描画（トップレベルでも分岐の中＝ネストでも使う再帰対応版）。
// 「はい／いいえ」は画面幅やネストの深さによらず常に縦1カラムに積む。横に並べると
// ネストが深いときに文字が潰れるため、Web版もこの見た目に統一されている。
function IfCardNode({ step, depth, position }: { step: IfStep; depth: number; position: Position }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const deleteStep = useNotebooks((s) => s.deleteStep);
  const focusId = useUi((s) => s.focusId);
  const setFocus = useUi((s) => s.setFocus);

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
          placeholderTextColor={colors.placeholder}
          autoFocus={focusId === step.id}
          onFocus={() => focusId === step.id && setFocus(null)}
          accessibilityLabel="分かれ道の条件"
          style={styles.cond}
        />
        <StepActions
          stepId={step.id}
          isFirst={position.isFirst}
          isLast={position.isLast}
          deleteLabel="このif分岐を削除"
          onDelete={() => deleteStep(step.id)}
        />
      </View>

      <View style={styles.branches}>
        {BRANCH_KEYS.map((key) => (
          <BranchColumn key={key} step={step} branchKey={key} depth={depth} />
        ))}
      </View>
    </View>
  );
}

function BranchColumn({ step, branchKey, depth }: { step: IfStep; branchKey: BranchKey; depth: number }) {
  const setBranchLabel = useNotebooks((s) => s.setBranchLabel);
  const addBranchStep = useNotebooks((s) => s.addBranchStep);
  const addBranchIfStep = useNotebooks((s) => s.addBranchIfStep);
  const setFocus = useUi((s) => s.setFocus);

  const items = step.branches[branchKey];

  return (
    <View style={styles.branch}>
      <TextInput
        value={step.labels[branchKey]}
        onChangeText={(t) => setBranchLabel(step.id, branchKey, t)}
        maxLength={MAX_BRANCH_LABEL}
        accessibilityLabel={branchKey === "yes" ? "はい側のラベル" : "いいえ側のラベル"}
        style={styles.branchLabel}
      />

      {/* 分岐の中身は「工程カード」か「入れ子 if 分岐カード」のどちらか */}
      {items.map((item: Step, index: number) => {
        const position = { isFirst: index === 0, isLast: index === items.length - 1 };
        return item.type === "if" ? (
          <View key={item.id} style={styles.nestedIfWrap}>
            <IfCardNode step={item} depth={depth + 1} position={position} />
          </View>
        ) : (
          <BranchStepRow key={item.id} branch={item} position={position} />
        );
      })}

      <View style={styles.branchAddRow}>
        <Pressable
          style={styles.branchAdd}
          onPress={() => setFocus(addBranchStep(step.id, branchKey))}
          accessibilityRole="button"
          accessibilityLabel="この分岐に工程を追加"
        >
          <Text style={styles.branchAddText}>＋工程</Text>
        </Pressable>
        <Pressable
          style={styles.branchAdd}
          onPress={() => setFocus(addBranchIfStep(step.id, branchKey))}
          accessibilityRole="button"
          accessibilityLabel="この分岐にif分岐を追加"
        >
          <Text style={styles.branchAddText}>＋🔀if</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BranchStepRow({ branch, position }: { branch: NormalStep; position: Position }) {
  const setStepText = useNotebooks((s) => s.setStepText);
  const toggleStep = useNotebooks((s) => s.toggleStep);
  const deleteStep = useNotebooks((s) => s.deleteStep);
  const focusId = useUi((s) => s.focusId);
  const setFocus = useUi((s) => s.setFocus);

  // 手ごたえは工程カードと揃える（紙吹雪は最上位の工程だけの演出のまま）。
  const onCheck = () => {
    if (toggleStep(branch.id)) successFeedback();
  };

  return (
    <View style={styles.branchStep}>
      <Pressable
        style={[styles.bcheck, branch.done && styles.bcheckDone]}
        onPress={onCheck}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: branch.done }}
        accessibilityLabel={branch.text.trim() || "空の工程"}
      >
        <Text style={[styles.bcheckMark, branch.done && styles.bcheckMarkDone]}>{branch.done ? "✓" : ""}</Text>
      </Pressable>

      <TextInput
        value={branch.text}
        onChangeText={(t) => setStepText(branch.id, t)}
        multiline
        placeholder="工程を入力…"
        placeholderTextColor={colors.placeholder}
        autoFocus={focusId === branch.id}
        onFocus={() => focusId === branch.id && setFocus(null)}
        accessibilityLabel="工程の内容"
        style={[styles.branchText, branch.done && styles.branchTextDone]}
      />

      <StepActions
        stepId={branch.id}
        isFirst={position.isFirst}
        isLast={position.isLast}
        compact
        onDelete={() => deleteStep(branch.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.ifCard.bg,
    borderWidth: 1.5,
    borderColor: colors.ifCard.border,
    borderStyle: "dashed",
    borderRadius: radii.card,
    padding: space.md,
    boxShadow: shadows.card,
  },
  cardTop: {
    maxWidth: 420,
    alignSelf: "center",
  },
  cardNested: {
    padding: space.sm + 2,
  },
  cardNest1: {
    backgroundColor: colors.ifCardNest1.bg,
    borderColor: colors.ifCardNest1.border,
  },
  cardNest2: {
    backgroundColor: colors.ifCardNest2.bg,
    borderColor: colors.ifCardNest2.border,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: space.sm,
  },
  ifIcon: {
    ...text.body,
    marginTop: 3,
  },
  cond: {
    flex: 1,
    ...text.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  branches: {
    gap: space.sm,
  },
  branch: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: radii.small,
    padding: space.sm,
    gap: 6,
  },
  branchLabel: {
    ...text.labelBold,
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
    borderRadius: radii.small,
    paddingVertical: 7,
    paddingHorizontal: space.sm,
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
    ...text.caption,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink,
    padding: 0,
  },
  branchTextDone: {
    opacity: 0.55,
    textDecorationLine: "line-through",
  },
  branchAddRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  branchAdd: {
    borderWidth: 1,
    borderColor: colors.dashed,
    borderStyle: "dashed",
    borderRadius: radii.small,
    paddingVertical: 5,
    paddingHorizontal: space.sm + 2,
  },
  branchAddText: {
    ...text.caption,
    color: colors.lavenderDeep,
  },
});
