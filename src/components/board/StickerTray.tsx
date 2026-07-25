import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chic as chicTheme, colors, radii, space, text, TRAY_BASE_HEIGHT } from "@/lib/theme";
import { STICKER_TYPES } from "@/lib/types";
import type { StickerType } from "@/lib/types";
import { StickerShape, stickerLabel } from "@/components/ui/StickerShape";

interface TrayProps {
  isNoteStyle: boolean;
  sparkleOn: boolean;
  canUndo: boolean;
  connectMode: boolean;
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
  chicMode = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  chicMode?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected: active }}
      style={({ pressed }) => [
        styles.btn,
        chicMode && styles.btnChic,
        active && (chicMode ? styles.btnChicActive : styles.btnActive),
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, chicMode && styles.btnTextChic, active && chicMode && styles.btnTextChicActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MenuRow({
  label,
  hint,
  onPress,
  danger = false,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.menuRow, pressed && styles.btnPressed]}
    >
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuHint}>{hint}</Text>
    </Pressable>
  );
}

export function StickerTray(props: TrayProps) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const runFromMenu = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <>
      <View style={[styles.tray, { paddingBottom: insets.bottom + space.sm }, props.isNoteStyle && styles.trayChic]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {/* シールは11種類あるので、ひとまとまりの「シールシート」に見えるよう
              薄く敷いた帯の上に並べる */}
          <View style={[styles.stickerRail, props.isNoteStyle && styles.stickerRailChic]}>
            <Text style={[styles.railLabel, props.isNoteStyle && styles.railLabelChic]}>シール</Text>
            {STICKER_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => props.onAddSticker(type)}
                style={({ pressed }) => [styles.sticker, pressed && styles.btnPressed]}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`${stickerLabel(type)}のシールを貼る`}
              >
                <StickerShape type={type} size={32} />
              </Pressable>
            ))}
          </View>

          {props.isNoteStyle ? (
            <>
              <View style={styles.divider} />
              <TrayButton label="＋テキスト" onPress={props.onAddText} chicMode={props.isNoteStyle} />
              <TrayButton label="＋写真" onPress={props.onAddPhoto} chicMode={props.isNoteStyle} />
              <TrayButton
                label="🔗 線"
                onPress={props.onToggleConnect}
                active={props.connectMode}
                chicMode={props.isNoteStyle}
                accessibilityLabel="テキスト同士をつなぐ線"
              />
            </>
          ) : null}

          <View style={styles.divider} />
          <TrayButton
            label="✨ きらめき"
            onPress={props.onToggleSparkle}
            active={props.sparkleOn}
            chicMode={props.isNoteStyle}
          />
          <TrayButton
            label="↩️ 元に戻す"
            onPress={props.onUndo}
            disabled={!props.canUndo}
            chicMode={props.isNoteStyle}
            accessibilityLabel="ひとつ前に戻す"
          />
          <TrayButton
            label="📸 保存"
            onPress={props.onScreenshot}
            chicMode={props.isNoteStyle}
            accessibilityLabel="画像で保存"
          />
          <TrayButton
            label="💾 書き出し"
            onPress={props.onExport}
            chicMode={props.isNoteStyle}
            accessibilityLabel="バックアップを書き出す"
          />
          <TrayButton
            label="⋯"
            onPress={() => setMenuOpen(true)}
            chicMode={props.isNoteStyle}
            accessibilityLabel="そのほかの道具"
          />
        </ScrollView>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="閉じる" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
            <Text style={styles.sheetTitle}>そのほかの道具</Text>
            <MenuRow
              label="📂 バックアップを読み込む"
              hint="いまの手帳をファイルの内容で置きかえます"
              onPress={runFromMenu(props.onImport)}
            />
            <MenuRow
              label="🗑️ このページを消去"
              hint="開いているページの中身だけを空にします"
              danger
              onPress={runFromMenu(props.onReset)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: TRAY_BASE_HEIGHT,
    backgroundColor: colors.veilSolid,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(201,182,228,0.35)",
    paddingTop: space.sm,
    zIndex: 20,
  },
  trayChic: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopColor: chicTheme.border,
  },
  row: {
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
  stickerRail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: space.sm,
    paddingRight: 6,
    paddingVertical: 3,
    borderRadius: radii.card,
    backgroundColor: "rgba(201,182,228,0.14)",
  },
  stickerRailChic: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  railLabel: {
    ...text.micro,
    color: colors.plum,
    opacity: 0.6,
  },
  railLabelChic: {
    color: chicTheme.inkSoft,
  },
  sticker: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.hairline,
  },
  btn: {
    minHeight: 32,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.card,
    paddingVertical: 6,
    paddingHorizontal: space.md,
    backgroundColor: "transparent",
  },
  btnActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(244,213,141,0.55)",
  },
  btnChic: {
    borderColor: "#CCCCCC",
  },
  btnChicActive: {
    borderColor: chicTheme.rule,
    backgroundColor: chicTheme.rule,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    ...text.label,
    color: colors.ink,
  },
  btnTextChic: {
    color: "#555555",
  },
  btnTextChicActive: {
    color: colors.white,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(74,63,92,0.35)",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.board,
    borderTopRightRadius: radii.board,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.xs,
  },
  sheetTitle: {
    ...text.displayS,
    color: colors.plum,
    marginBottom: space.xs,
  },
  menuRow: {
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radii.small,
    backgroundColor: colors.white,
  },
  menuLabel: {
    ...text.bodyBold,
    color: colors.ink,
  },
  menuLabelDanger: {
    color: colors.roseDeep,
  },
  menuHint: {
    ...text.caption,
    color: colors.ink,
    opacity: 0.6,
    marginTop: 2,
  },
});
