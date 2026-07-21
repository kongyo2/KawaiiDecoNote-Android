import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { Component } from "react";

function safeName(title: string): string {
  const trimmed = title.trim().replace(/[\\/:*?"<>|]/g, "_");
  return trimmed || "techo";
}

/**
 * 盤面の View を PNG として撮影し、共有シートで保存する。
 * Web版の html2canvas + ダウンロードに相当。
 */
export async function captureAndShare(ref: React.RefObject<Component | null>, title: string): Promise<void> {
  const shot = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });

  // 共有時のファイル名を手帳タイトルにする（コピーに失敗しても撮影ファイルをそのまま共有）
  let shareUri = shot;
  try {
    const dest = new File(Paths.cache, `${safeName(title)}.png`);
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
