import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { useNotebooks } from "@/state/notebooks";
import type { Page } from "@/lib/types";
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

export function FlowchartSection({ page }: { page: Page }) {
  const addStep = useNotebooks((s) => s.addStep);
  const addIfStep = useNotebooks((s) => s.addIfStep);

  return (
    <View>
      {page.steps.length === 0 ? (
        <Text style={styles.empty}>まだ工程がありません…{"\n"}下の「＋ 工程を追加」から始めてみてね🐰</Text>
      ) : (
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
      )}

      <Pressable style={styles.addMain} onPress={addStep}>
        <Text style={styles.addMainText}>＋ 工程を追加</Text>
      </Pressable>
      <Pressable style={styles.addIf} onPress={addIfStep}>
        <Text style={styles.addIfText}>＋🔀 if分岐を追加</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: "center",
    opacity: 0.55,
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 20,
    lineHeight: 26,
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
  addMain: {
    alignSelf: "center",
    marginTop: 22,
    backgroundColor: colors.lavender,
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 24,
    boxShadow: "0 4px 12px rgba(155,130,180,0.35)",
  },
  addMainText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
  addIf: {
    alignSelf: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "rgba(155,130,180,0.5)",
    borderStyle: "dashed",
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  addIfText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.plum,
  },
});
