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

const AUTOSAVE_MS = 8000;

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

  // アプリが前面から外れる瞬間と、一定時間ごとに保存する。
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") useNotebooks.getState().flushPending();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const id = setInterval(() => useNotebooks.getState().flushPending(), AUTOSAVE_MS);
    return () => clearInterval(id);
  }, []);

  // 写真を選んでいる途中でAndroidにアプリを落とされた場合、戻ってきたときに拾い直す。
  useEffect(() => {
    const recover = async () => {
      const before = useNotebooks.getState();
      const targetNotebook = selectCurrentNotebook(before)?.id;
      const targetPage = selectCurrentPage(before)?.id;
      const dataUrl = await recoverPendingPhotoAsDataUrl();
      if (!dataUrl || !targetNotebook || !targetPage) return;
      useNotebooks.getState().addPhotoTo(targetNotebook, targetPage, dataUrl, 16, 16);
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
      {/* 端末の「視差効果を減らす」設定をそのまま尊重する */}
      <ReducedMotionConfig mode={ReduceMotion.System} />
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
