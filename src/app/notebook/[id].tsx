import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BoardFrame } from "@/components/board/BoardFrame";
import { BoardTabs } from "@/components/board/BoardTabs";
import { FrameSelect } from "@/components/board/FrameSelect";
import { NoteControls } from "@/components/board/NoteControls";
import { PaperBackground } from "@/components/board/PaperBackground";
import { StickerTray } from "@/components/board/StickerTray";
import { FlowchartSection } from "@/components/flowchart/FlowchartSection";
import { FreeformCanvas } from "@/components/freeform/FreeformCanvas";
import { NotebookSection } from "@/components/notebook/NotebookSection";
import { exportBackup } from "@/lib/backup";
import { captureAndShare } from "@/lib/capture";
import { pickPhotoAsDataUrl } from "@/lib/files";
import { randomBetween } from "@/lib/format";
import { tapFeedback } from "@/lib/haptics";
import { notebookDisplayName, pageDisplayTitle } from "@/lib/model";
import { chic, colors, fonts, radii, shadows, space, text, TRAY_BASE_HEIGHT } from "@/lib/theme";
import { MAX_PAGE_TITLE } from "@/lib/types";
import type { StickerType } from "@/lib/types";
import { useImportBackup } from "@/state/backup";
import { activePageOf, selectNotebookById, useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

// 選択中のシールを画面から消してから撮るための待ち時間。
const CAPTURE_SETTLE_MS = 70;

export default function NotebookEditor() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const boardRef = useRef<View>(null);
  const [boardWidth, setBoardWidth] = useState(320);

  // ルートの id から直接引く。ストアの activeNotebookId を待たないので、
  // 画面に入った1フレーム目で「手帳が見つかりません」が出ることがない。
  const selectNotebook = useMemo(() => selectNotebookById(id), [id]);
  const notebook = useNotebooks(selectNotebook);
  const page = activePageOf(notebook);
  const canUndo = useNotebooks((s) => s.canUndo);
  const storageOk = useNotebooks((s) => s.storageOk);

  const setActivePage = useNotebooks((s) => s.setActivePage);
  const deletePage = useNotebooks((s) => s.deletePage);
  const duplicatePage = useNotebooks((s) => s.duplicatePage);
  const addPage = useNotebooks((s) => s.addPage);
  const setPageTitle = useNotebooks((s) => s.setPageTitle);
  const setFrame = useNotebooks((s) => s.setFrame);
  const setRuleStyle = useNotebooks((s) => s.setRuleStyle);
  const setPaperColor = useNotebooks((s) => s.setPaperColor);
  const toggleSparkle = useNotebooks((s) => s.toggleSparkle);
  const resetPage = useNotebooks((s) => s.resetPage);
  const addSticker = useNotebooks((s) => s.addSticker);
  const addShape = useNotebooks((s) => s.addShape);
  const addPhotoTo = useNotebooks((s) => s.addPhotoTo);

  const connectMode = useUi((s) => s.connectMode);
  const select = useUi((s) => s.select);
  const toggleConnectMode = useUi((s) => s.toggleConnectMode);
  const showToast = useUi((s) => s.showToast);

  useEffect(() => {
    if (id) useNotebooks.getState().openNotebook(id);
    return () => {
      useUi.getState().resetBoardUi();
      useNotebooks.getState().closeNotebook();
    };
  }, [id]);

  useEffect(() => {
    useUi.getState().resetBoardUi();
  }, [page?.id]);

  const onImport = useImportBackup(() => router.replace("/"));

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  if (!notebook || !page) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.missingText}>この手帳は見つかりませんでした</Text>
        <Pressable onPress={() => router.replace("/")} accessibilityRole="button">
          <Text style={styles.backText}>📚 手帳一覧に戻る</Text>
        </Pressable>
      </View>
    );
  }

  const isNoteStyle = notebook.type === "notestyle";

  // 「だいたいこのへん」に置く。毎回きっちり同じ場所だと重なって見えないため。
  const stickerPos = () => ({
    x: Math.round(randomBetween(30, Math.max(40, boardWidth - 60))),
    y: Math.round(randomBetween(40, 180)),
  });
  const shapePos = () => ({
    x: Math.round(randomBetween(16, Math.max(56, boardWidth - 160))),
    y: Math.round(randomBetween(16, 176)),
  });

  const onBoardLayout = (e: LayoutChangeEvent) => setBoardWidth(e.nativeEvent.layout.width);

  const onAddSticker = (type: StickerType) => {
    const p = stickerPos();
    addSticker(type, p.x, p.y);
    tapFeedback();
  };

  const onAddText = () => {
    const p = shapePos();
    const newId = addShape(p.x, p.y);
    select(newId);
    useUi.getState().setFocus(newId);
  };

  const onAddPhoto = async () => {
    const targetNotebook = notebook.id;
    const targetPage = page.id;
    const p = shapePos();
    try {
      const dataUrl = await pickPhotoAsDataUrl();
      if (!dataUrl) return;
      addPhotoTo(targetNotebook, targetPage, dataUrl, p.x, p.y);
      tapFeedback();
    } catch {
      showToast("⚠️ 写真の読み込みに失敗しました");
    }
  };

  const onToggleConnect = () => {
    const willEnable = !connectMode;
    toggleConnectMode();
    if (willEnable) showToast("🔗 つなぎたいテキストを2つ順にタップしてね");
  };

  const onUndo = () => {
    const ok = useNotebooks.getState().undo();
    useUi.getState().resetBoardUi();
    showToast(ok ? "↩️ ひとつ前に戻しました" : "⚠️ まだ保存中で戻せません…もう一度どうぞ");
  };

  const onScreenshot = async () => {
    select(null);
    await new Promise((r) => setTimeout(r, CAPTURE_SETTLE_MS));
    try {
      await captureAndShare(boardRef, page.title || "techo");
      showToast("画像を保存しました📸");
    } catch {
      showToast("スクショに失敗しました…💦");
    }
  };

  const onExport = async () => {
    try {
      await exportBackup(useNotebooks.getState().doc);
      showToast("バックアップを書き出しました💾");
    } catch {
      showToast("書き出しに失敗しました…");
    }
  };

  const onReset = () => {
    Alert.alert(
      "ページを消去",
      `「${pageDisplayTitle(page)}」の中身を全部消します。消したあとでも「元に戻す」で戻せます。`,
      [
        { text: "やめる", style: "cancel" },
        {
          text: "消去",
          style: "destructive",
          onPress: () => {
            resetPage();
            useUi.getState().resetBoardUi();
            showToast("ページを空にしました。元に戻せます🗑️");
          },
        },
      ],
    );
  };

  const onDuplicatePage = (pageId: string) => {
    if (!duplicatePage(pageId)) return;
    tapFeedback();
    showToast("ページをコピーしたよ📄✨");
  };

  const onDeletePage = (pageId: string) => {
    if (notebook.pages.length <= 1) {
      showToast("最後のページは消せません🌸");
      return;
    }
    const target = notebook.pages.find((p) => p.id === pageId);
    Alert.alert(
      "ページを削除",
      `「${target ? pageDisplayTitle(target) : "このページ"}」を中身ごと削除します。消したあとでも「元に戻す」で戻せます。`,
      [
        { text: "やめる", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            deletePage(pageId);
            showToast("ページを削除しました。元に戻せます🗑️");
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.sm, paddingBottom: TRAY_BASE_HEIGHT + insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={goBack} style={styles.back} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.backText, isNoteStyle && styles.backTextChic]}>📚 一覧</Text>
          </Pressable>
          <Text style={[styles.notebookName, isNoteStyle && styles.notebookNameChic]} numberOfLines={1}>
            {notebookDisplayName(notebook)}
          </Text>
        </View>

        <BoardTabs
          notebook={notebook}
          onSelect={setActivePage}
          onDuplicate={onDuplicatePage}
          onDelete={onDeletePage}
          onAddPage={addPage}
        />

        <TextInput
          value={page.title}
          onChangeText={setPageTitle}
          placeholder="✏️ このページのタイトル"
          placeholderTextColor={colors.placeholder}
          maxLength={MAX_PAGE_TITLE}
          accessibilityLabel="ページのタイトル"
          style={[styles.titleInput, isNoteStyle && styles.titleInputChic]}
        />

        {isNoteStyle ? (
          <View style={styles.controls}>
            <NoteControls
              ruleStyle={page.ruleStyle}
              paperColor={page.paperColor}
              onRule={setRuleStyle}
              onPaper={setPaperColor}
            />
          </View>
        ) : (
          <FrameSelect frame={page.frame} onSelect={setFrame} />
        )}

        <View ref={boardRef} collapsable={false} style={styles.capture}>
          {isNoteStyle ? (
            <View style={[styles.notestyleBoard, { backgroundColor: page.paperColor }]} onLayout={onBoardLayout}>
              <PaperBackground ruleStyle={page.ruleStyle} color={page.paperColor} />
              <FreeformCanvas page={page} />
            </View>
          ) : (
            <View onLayout={onBoardLayout}>
              <BoardFrame page={page}>
                {page.type === "flowchart" ? <FlowchartSection page={page} /> : <NotebookSection page={page} />}
              </BoardFrame>
            </View>
          )}
        </View>
      </ScrollView>

      {!storageOk ? (
        <Pressable
          style={[styles.saveWarn, { top: insets.top + 6 }]}
          onPress={onExport}
          accessibilityRole="button"
          accessibilityLabel="保存できていません。タップしてバックアップを書き出す"
        >
          <Text style={styles.saveWarnText}>⚠️ 保存できていません。タップして「💾書き出し」でバックアップを</Text>
        </Pressable>
      ) : null}

      <StickerTray
        isNoteStyle={isNoteStyle}
        sparkleOn={page.sparkleOn}
        canUndo={canUndo}
        connectMode={connectMode}
        onAddSticker={onAddSticker}
        onAddText={onAddText}
        onAddPhoto={onAddPhoto}
        onToggleConnect={onToggleConnect}
        onToggleSparkle={toggleSparkle}
        onUndo={onUndo}
        onScreenshot={onScreenshot}
        onExport={onExport}
        onImport={onImport}
        onReset={onReset}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.md + 2,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.xs,
  },
  back: {
    paddingVertical: space.xs,
    paddingRight: space.xs,
  },
  backText: {
    ...text.label,
    color: colors.plum,
  },
  backTextChic: {
    color: chic.inkSoft,
  },
  notebookName: {
    flex: 1,
    ...text.caption,
    color: colors.plum,
    opacity: 0.7,
    textAlign: "right",
  },
  notebookNameChic: {
    color: chic.inkSoft,
  },
  titleInput: {
    alignSelf: "center",
    width: "92%",
    textAlign: "center",
    // TextInput は lineHeight を指定するとAndroidで縦位置がずれやすいので、
    // ここだけは字面サイズだけを指定する。
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    backgroundColor: colors.veil,
    borderBottomWidth: 2,
    borderBottomColor: colors.dashed,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: space.sm,
    marginTop: space.sm,
    marginBottom: 6,
  },
  titleInputChic: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: chic.ink,
    backgroundColor: "transparent",
    borderBottomColor: "#CCCCCC",
  },
  controls: {
    marginTop: space.sm,
    paddingHorizontal: space.xs,
  },
  capture: {
    marginTop: space.xs,
  },
  notestyleBoard: {
    borderRadius: 8,
    padding: space.md,
    minHeight: 320,
    overflow: "hidden",
    boxShadow: shadows.chicBoard,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    gap: space.lg,
  },
  missingText: {
    ...text.bodyL,
    color: colors.ink,
  },
  saveWarn: {
    position: "absolute",
    left: space.md,
    right: space.md,
    backgroundColor: colors.warnBg,
    borderWidth: 1.5,
    borderColor: colors.warnBorder,
    borderRadius: radii.small,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    zIndex: 50,
  },
  saveWarnText: {
    ...text.label,
    color: colors.warnInk,
    textAlign: "center",
  },
});
