import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { exportBackup, pickBackup } from "@/lib/backup";
import { captureAndShare } from "@/lib/capture";
import { pickPhotoAsDataUrl } from "@/lib/files";
import { colors, fonts, TRAY_BASE_HEIGHT } from "@/lib/theme";
import type { StickerType } from "@/lib/types";
import { selectCurrentNotebook, selectCurrentPage, useNotebooks } from "@/state/notebooks";
import { useUi } from "@/state/ui";

export default function NotebookEditor() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const boardRef = useRef<View>(null);
  const [boardWidth, setBoardWidth] = useState(320);

  const notebook = useNotebooks(selectCurrentNotebook);
  const page = useNotebooks(selectCurrentPage);
  const canUndo = useNotebooks((s) => s.canUndo);
  const storageOk = useNotebooks((s) => s.storageOk);

  const setActivePage = useNotebooks((s) => s.setActivePage);
  const deletePage = useNotebooks((s) => s.deletePage);
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
  const undo = useNotebooks((s) => s.undo);
  const importState = useNotebooks((s) => s.importState);

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

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  if (!notebook || !page) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.missingText}>手帳が見つかりませんでした</Text>
        <Pressable onPress={() => router.replace("/")}>
          <Text style={styles.backBtn}>📚 手帳一覧に戻る</Text>
        </Pressable>
      </View>
    );
  }

  const isNoteStyle = notebook.type === "notestyle";
  const rand = (max: number) => Math.random() * Math.max(0, max);
  const stickerPos = () => ({ x: Math.round(30 + rand(boardWidth - 90)), y: Math.round(40 + rand(140)) });
  const shapePos = () => ({ x: Math.round(16 + rand(Math.max(40, boardWidth - 160))), y: Math.round(16 + rand(160)) });

  const onBoardLayout = (e: LayoutChangeEvent) => setBoardWidth(e.nativeEvent.layout.width);

  const onAddSticker = (type: StickerType) => {
    const p = stickerPos();
    addSticker(type, p.x, p.y);
  };
  const onAddText = () => {
    const p = shapePos();
    addShape(p.x, p.y);
  };
  const onAddPhoto = async () => {
    const targetNotebook = notebook.id;
    const targetPage = page.id;
    const p = shapePos();
    try {
      const dataUrl = await pickPhotoAsDataUrl();
      if (!dataUrl) return;
      addPhotoTo(targetNotebook, targetPage, dataUrl, p.x, p.y);
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
    const ok = undo();
    useUi.getState().resetBoardUi();
    showToast(ok ? "↩️ ひとつ前に戻しました" : "⚠️ まだ保存中で戻せません…もう一度どうぞ");
  };
  const onScreenshot = async () => {
    select(null);
    await new Promise((r) => setTimeout(r, 70));
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
  const onImport = async () => {
    const res = await pickBackup();
    if (res.status === "canceled") return;
    if (res.status === "invalid") {
      showToast("⚠️ 読み込みに失敗しました…ファイルを確認してね");
      return;
    }
    Alert.alert(
      "バックアップを読み込む",
      "現在のすべての手帳を、このバックアップの内容で上書きします。よろしいですか？",
      [
        { text: "やめる", style: "cancel" },
        {
          text: "上書き",
          style: "destructive",
          onPress: () => {
            importState(res.state);
            showToast("バックアップを読み込みました🌸");
            router.replace("/");
          },
        },
      ],
    );
  };
  const onReset = () => {
    Alert.alert("ページを消去", "このページの中身を全部消します。よろしいですか？", [
      { text: "やめる", style: "cancel" },
      {
        text: "消去",
        style: "destructive",
        onPress: () => {
          resetPage();
          useUi.getState().resetBoardUi();
        },
      },
    ]);
  };
  const onDeletePage = (pageId: string) => {
    if (notebook.pages.length <= 1) {
      showToast("最後のページは消せません🌸");
      return;
    }
    Alert.alert("ページを削除", "このページを削除します。中身も全部消えます。よろしいですか？", [
      { text: "やめる", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deletePage(pageId) },
    ]);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: TRAY_BASE_HEIGHT + insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={goBack} style={styles.back} hitSlop={6}>
          <Text style={[styles.backBtn, isNoteStyle && styles.backBtnChic]}>📚 手帳一覧に戻る</Text>
        </Pressable>

        <BoardTabs notebook={notebook} onSelect={setActivePage} onDelete={onDeletePage} onAddPage={addPage} />

        <TextInput
          value={page.title}
          onChangeText={setPageTitle}
          placeholder="✏️ このページのタイトル"
          placeholderTextColor="rgba(90,77,112,0.4)"
          maxLength={40}
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

      {}
      {!storageOk ? (
        <Pressable style={[styles.saveWarn, { top: insets.top + 6 }]} onPress={onExport}>
          <Text style={styles.saveWarnText}>⚠️ 保存できていません。タップして「💾書き出し」でバックアップを</Text>
        </Pressable>
      ) : null}

      <StickerTray
        isNoteStyle={isNoteStyle}
        sparkleOn={page.sparkleOn}
        canUndo={canUndo}
        connectMode={connectMode}
        chic={isNoteStyle}
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
    paddingHorizontal: 14,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
  },
  back: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  backBtn: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.plum,
  },
  backBtnChic: {
    color: "#777",
  },
  titleInput: {
    alignSelf: "center",
    width: "92%",
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(155,130,180,0.4)",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  titleInputChic: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: "#333",
    backgroundColor: "transparent",
    borderBottomColor: "#ccc",
  },
  controls: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  capture: {
    marginTop: 4,
  },
  notestyleBoard: {
    borderRadius: 8,
    padding: 12,
    minHeight: 320,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  missing: {
    flex: 1,
    alignItems: "center",
    gap: 16,
  },
  missingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  saveWarn: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "#fff3e0",
    borderWidth: 1.5,
    borderColor: "#f0b86e",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 50,
  },
  saveWarnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#7a4a12",
    textAlign: "center",
  },
});
