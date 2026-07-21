import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/lib/theme";
import { STICKER_TYPES } from "@/lib/types";
import type { StickerType } from "@/lib/types";
import { StickerShape } from "@/components/ui/StickerShape";

interface TrayProps {
  isNoteStyle: boolean;
  sparkleOn: boolean;
  canUndo: boolean;
  connectMode: boolean;
  chic: boolean;
  onAddSticker: (type: StickerType) => void;
  onAddText: () => void;
  onAddPhoto: () => void;
  onToggleConnect: () => void;
  onToggleSparkle: () => void;
  onUndo: () => void;
  onScreenshot: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

function TrayButton({
  label,
  onPress,
  active = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, active && styles.btnActive, disabled && styles.btnDisabled]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export function StickerTray(props: TrayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tray, { paddingBottom: insets.bottom + 8 }, props.chic && styles.trayChic]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Text style={styles.label}>シール</Text>
        {STICKER_TYPES.map((type) => (
          <Pressable key={type} onPress={() => props.onAddSticker(type)} style={styles.sticker} hitSlop={4}>
            <StickerShape type={type} size={34} />
          </Pressable>
        ))}

        {props.isNoteStyle ? (
          <>
            <View style={styles.divider} />
            <TrayButton label="＋テキスト" onPress={props.onAddText} />
            <TrayButton label="＋写真" onPress={props.onAddPhoto} />
            <TrayButton label="🔗 線" onPress={props.onToggleConnect} active={props.connectMode} />
          </>
        ) : null}

        <View style={styles.divider} />
        <TrayButton label="✨ きらめき" onPress={props.onToggleSparkle} active={props.sparkleOn} />
        <TrayButton label="↩️ 元に戻す" onPress={props.onUndo} disabled={!props.canUndo} />
        <TrayButton label="📸 保存" onPress={props.onScreenshot} />
        <TrayButton label="💾 書き出し" onPress={props.onExport} />
        <TrayButton label="📂 読み込み" onPress={props.onImport} />
        <TrayButton label="🗑️" onPress={props.onReset} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(201,182,228,0.35)",
    paddingTop: 8,
    zIndex: 20,
  },
  trayChic: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopColor: "#ddd",
  },
  row: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.ink,
    opacity: 0.55,
  },
  sticker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(155,130,180,0.25)",
  },
  btn: {
    borderWidth: 1.5,
    borderColor: "rgba(155,130,180,0.35)",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  btnActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(244,213,141,0.55)",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
  },
});
