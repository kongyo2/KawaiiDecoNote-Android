import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { PALETTE_COLORS } from "@/lib/types";
import type { NotebookType } from "@/lib/types";
import { AppButton, AppTextInput, Card } from "@/components/ui/kit";

const TYPE_OPTIONS: { key: NotebookType; label: string; sub: string }[] = [
  { key: "notestyle", label: "📓 ノート式", sub: "白紙から自由にデコる" },
  { key: "profile", label: "📔 プロフィール帳式", sub: "最初からかわいいテンプレ" },
];

export function CreatePanel({
  onCreate,
  onCancel,
}: {
  onCreate: (type: NotebookType, name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<NotebookType>("profile");
  const [color, setColor] = useState<string>(PALETTE_COLORS[0]);
  const [name, setName] = useState("");

  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>新しい手帳をつくる</Text>

      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map((opt) => {
          const selected = type === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.typeBtn, selected && styles.typeBtnSelected]}
              onPress={() => setType(opt.key)}
            >
              <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{opt.label}</Text>
              <Text style={styles.typeSub}>{opt.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.swatches}>
        {PALETTE_COLORS.map((c) => (
          <Pressable
            key={c}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <AppTextInput
        value={name}
        onChangeText={setName}
        placeholder="手帳のなまえ"
        maxLength={30}
        style={styles.nameInput}
      />

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
    marginTop: 18,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.plum,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  typeBtnSelected: {
    borderColor: colors.lavender,
    backgroundColor: "rgba(201,182,228,0.25)",
  },
  typeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    textAlign: "center",
  },
  typeLabelSelected: {
    fontFamily: fonts.bodyBold,
  },
  typeSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.ink,
    opacity: 0.6,
    marginTop: 3,
    textAlign: "center",
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
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
  nameInput: {
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
});
