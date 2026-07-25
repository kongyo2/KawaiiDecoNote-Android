import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, space, text } from "@/lib/theme";
import { colorLabel, COLOR_LABELS, DEFAULT_NOTEBOOK_COLOR, MAX_NOTEBOOK_NAME, PALETTE_COLORS } from "@/lib/types";
import type { NotebookType } from "@/lib/types";
import { AppButton, AppTextInput, Card, PanelTitle } from "@/components/ui/kit";
import { CoverArt } from "./CoverArt";

const TYPE_OPTIONS: { key: NotebookType; label: string; sub: string }[] = [
  { key: "notestyle", label: "📓 ノート式", sub: "白紙に自由に置いてデコる" },
  { key: "profile", label: "📔 プロフィール帳式", sub: "飾り枠つきの工程ページ" },
];

export function CreatePanel({
  onCreate,
  onCancel,
}: {
  onCreate: (type: NotebookType, name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<NotebookType>("profile");
  const [color, setColor] = useState<string>(DEFAULT_NOTEBOOK_COLOR);
  const [name, setName] = useState("");

  const previewName = name.trim() || (type === "notestyle" ? "無題のノート" : "無題のプロフィール帳");

  return (
    <Card style={styles.card}>
      <PanelTitle>新しい手帳をつくる</PanelTitle>

      {/* 選んだ内容がそのまま表紙になる。作る前に仕上がりが見えるようにしている */}
      <View style={styles.topRow}>
        <View style={styles.preview}>
          <CoverArt name={previewName} type={type} color={color} pageCount={1} />
        </View>

        <View style={styles.typeColumn}>
          {TYPE_OPTIONS.map((opt) => {
            const selected = type === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [styles.typeBtn, selected && styles.typeBtnSelected, pressed && styles.pressed]}
                onPress={() => setType(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{opt.label}</Text>
                <Text style={styles.typeSub}>{opt.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AppTextInput
        value={name}
        onChangeText={setName}
        placeholder="手帳のなまえ"
        maxLength={MAX_NOTEBOOK_NAME}
        style={styles.nameInput}
      />

      <Text style={styles.sectionLabel}>表紙の色</Text>
      <View style={styles.swatches}>
        {PALETTE_COLORS.map((c) => {
          const selected = color === c;
          return (
            <Pressable
              key={c}
              style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchSelected]}
              onPress={() => setColor(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={colorLabel(COLOR_LABELS, c)}
              hitSlop={6}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <AppButton
          title="つくる🌸"
          variant="primary"
          onPress={() => onCreate(type, name.trim(), color)}
          style={styles.flex}
        />
        <AppButton title="やめる" variant="soft" onPress={onCancel} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.lg,
  },
  topRow: {
    flexDirection: "row",
    gap: space.md,
    marginBottom: space.md,
  },
  preview: {
    width: 92,
    aspectRatio: 3 / 4,
    borderRadius: radii.card,
    boxShadow: shadows.raised,
  },
  typeColumn: {
    flex: 1,
    gap: space.sm,
    justifyContent: "center",
  },
  typeBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  typeBtnSelected: {
    borderColor: colors.lavender,
    backgroundColor: "rgba(201,182,228,0.25)",
  },
  pressed: {
    opacity: 0.75,
  },
  typeLabel: {
    ...text.label,
    color: colors.ink,
  },
  typeLabelSelected: {
    ...text.labelBold,
  },
  typeSub: {
    ...text.micro,
    color: colors.ink,
    opacity: 0.6,
    marginTop: 2,
  },
  nameInput: {
    marginBottom: space.md,
  },
  sectionLabel: {
    ...text.caption,
    color: colors.ink,
    opacity: 0.7,
    marginBottom: space.xs,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    marginBottom: space.lg,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: colors.plum,
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
});
