import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { Component } from "react";
import { fileStamp, safeFileName } from "./format";

export async function captureAndShare(ref: React.RefObject<Component | null>, title: string): Promise<void> {
  const shot = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });

  // 共有シートに出るファイル名を「ページ名-日時.png」にしたいだけなので、
  // 同名がすでにある場合やコピーに失敗した場合は、元の一時ファイルを
  // そのまま共有する。既存ファイルを消しにいかないのは、前回の共有が
  // まだそのファイルを開いている可能性があるため。
  let shareUri = shot;
  try {
    const dest = new File(Paths.cache, `${safeFileName(title, "techo")}-${fileStamp()}.png`);
    if (!dest.exists) {
      new File(shot).copy(dest);
      shareUri = dest.uri;
    }
  } catch {
    shareUri = shot;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: "image/png", dialogTitle: "画像を保存" });
  }
}
