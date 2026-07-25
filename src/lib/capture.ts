import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { Component } from "react";
import { safeFileName, todayStamp } from "./format";

export async function captureAndShare(ref: React.RefObject<Component | null>, title: string): Promise<void> {
  const shot = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });

  // 共有シートに出るファイル名を「ページ名-日付.png」にしたいだけなので、
  // コピーに失敗したら元の一時ファイルをそのまま共有する。
  let shareUri = shot;
  try {
    const dest = new File(Paths.cache, `${safeFileName(title, "techo")}-${todayStamp()}.png`);
    if (dest.exists) dest.delete();
    new File(shot).copy(dest);
    shareUri = dest.uri;
  } catch {
    shareUri = shot;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: "image/png", dialogTitle: "画像を保存" });
  }
}
