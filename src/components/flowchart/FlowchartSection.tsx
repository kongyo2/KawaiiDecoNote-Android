import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { stepProgress } from "@/lib/model";
import { colors, space, text } from "@/lib/theme";
import type { Page } from "@/lib/types";
import { useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";
import { AppButton } from "@/components/ui/kit";
import { StepCard } from "./StepCard";
import { IfCard } from "./IfCard";

function Connector() {
  return (
    <View style={styles.connector} pointerEvents="none">
      <View style={styles.connectorLine} />
      <View style={styles.connectorArrow} />
    </View>
  );
}

// 「いくつ終わったか」は工程表そのものの情報なので、飾りではなく見出しとして置く。
function Progress({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;
  return (
    <View
      style={styles.progress}
      accessibilityRole="progressbar"
      accessibilityLabel={`${total}工程のうち${done}つ完了`}
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>{complete ? `ぜんぶできた！🎉 ${done}/${total}` : `${done}/${total}`}</Text>
    </View>
  );
}

export function FlowchartSection({ page }: { page: Page }) {
  const addStep = useNotebooks((s) => s.addStep);
  const addIfStep = useNotebooks((s) => s.addIfStep);
  const setFocus = useUi((s) => s.setFocus);

  const { done, total } = stepProgress(page.steps);

  return (
    <View>
      {page.steps.length === 0 ? (
        <Text style={styles.empty}>ここは工程表のページ。{"\n"}下の「＋ 工程を追加」から1つめを書いてみてね🐰</Text>
      ) : (
        <>
          {total > 0 ? <Progress done={done} total={total} /> : null}
          <View style={styles.steps}>
            {page.steps.map((step, index) => (
              <Fragment key={step.id}>
                {index > 0 ? <Connector /> : null}
                {step.type === "if" ? (
                  <IfCard step={step} index={index} count={page.steps.length} />
                ) : (
                  <StepCard step={step} index={index} count={page.steps.length} />
                )}
              </Fragment>
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <AppButton title="＋ 工程を追加" variant="primary" onPress={() => setFocus(addStep())} style={styles.addMain} />
        <AppButton
          title="＋🔀 if分岐を追加"
          variant="dashed"
          onPress={() => setFocus(addIfStep())}
          style={styles.addIf}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: "center",
    opacity: 0.55,
    ...text.displayS,
    color: colors.ink,
    paddingVertical: space.xl,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    marginBottom: space.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.veilWeak,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.mint,
  },
  progressText: {
    ...text.caption,
    color: colors.plum,
  },
  steps: {
    alignItems: "center",
  },
  connector: {
    alignItems: "center",
    height: 26,
    justifyContent: "center",
  },
  connectorLine: {
    width: 0,
    height: 20,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(155,130,180,0.45)",
    borderStyle: "dashed",
  },
  connectorArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.connector,
  },
  actions: {
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xl,
  },
  addMain: {
    paddingHorizontal: 26,
  },
  addIf: {
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
});
