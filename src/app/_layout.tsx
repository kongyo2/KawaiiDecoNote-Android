// 使う3ウェイトだけをサブパスから読み込み、他ウェイトはバンドルしない
import { MPLUSRounded1c_400Regular } from "@expo-google-fonts/m-plus-rounded-1c/400Regular";
import { MPLUSRounded1c_700Bold } from "@expo-google-fonts/m-plus-rounded-1c/700Bold";
import { Yomogi_400Regular } from "@expo-google-fonts/yomogi/400Regular";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReduceMotion, ReducedMotionConfig } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Background } from "@/components/ui/Background";
import { SparkleLayer } from "@/components/ui/SparkleLayer";
import { Toast } from "@/components/ui/Toast";
import { recoverPendingPhotoAsDataUrl } from "@/lib/files";
import { colors } from "@/lib/theme";
import { selectCurrentNotebook, selectCurrentPage, useNotebooks } from "@/state/notebooks";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Yomogi_400Regular,
    MPLUSRounded1c_400Regular,
    MPLUSRounded1c_700Bold,
  });
  const [initialized, setInitialized] = useState(false);

  const chic = useNotebooks((s) => selectCurrentNotebook(s)?.type === "notestyle");
  const sparkleActive = useNotebooks((s) => selectCurrentPage(s)?.sparkleOn ?? false);

  useEffect(() => {
    useNotebooks.getState().initialize();
    setInitialized(true);
  }, []);

  // アプリがバックグラウンドへ回るとき、デバウンス中の未保存編集を確定させる
  // （Web版の visibilitychange / pagehide 相当。強制終了前の入力ロストを防ぐ）
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") useNotebooks.getState().flushPending();
    });
    return () => sub.remove();
  }, []);

  // 保存が一時的に失敗しても、定期的に再保存を試みる（Web版の8秒ごとフラッシュ相当）
  useEffect(() => {
    const id = setInterval(() => useNotebooks.getState().flushPending(), 8000);
    return () => clearInterval(id);
  }, []);

  // Android: 写真ピッカー中にアクティビティが破棄されても、復帰時に選択結果を拾って
  // 開いている手帳のページに貼る（貼り先が無ければ捨てる）
  useEffect(() => {
    const recover = async () => {
      const dataUrl = await recoverPendingPhotoAsDataUrl();
      if (!dataUrl) return;
      const st = useNotebooks.getState();
      if (st.doc.activeNotebookId) st.addPhoto(dataUrl, 16, 16);
    };
    void recover();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void recover();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded && initialized) void SplashScreen.hideAsync();
  }, [fontsLoaded, initialized]);

  if (!fontsLoaded || !initialized) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <SafeAreaProvider>
        <View style={styles.root}>
          <Background chic={chic} />
          <SparkleLayer active={sparkleActive} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
            }}
          />
          <Toast />
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgMid,
  },
});
