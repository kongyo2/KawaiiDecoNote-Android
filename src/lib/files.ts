import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/**
 * フォトライブラリから1枚選び、長辺 maxDim に収まるよう縮小した JPEG を
 * data URL（Web版と同じ埋め込み形式）で返す。キャンセル時は null。
 */
export async function pickPhotoAsDataUrl(maxDim = 900, quality = 0.82): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  const width = asset.width ?? maxDim;
  const height = asset.height ?? maxDim;
  const actions: { resize: { width: number } | { height: number } }[] = [];
  if (width > maxDim || height > maxDim) {
    actions.push(width >= height ? { resize: { width: maxDim } } : { resize: { height: maxDim } });
  }

  const out = await manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) return null;
  return `data:image/jpeg;base64,${out.base64}`;
}

/** キャッシュ領域にテキストファイルを書いて URI を返す（バックアップ書き出し用） */
export function writeTextFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.write(content);
  return file.uri;
}

/** 選んだファイルの中身を読む（バックアップ読み込み用） */
export function readTextFile(uri: string): string {
  return new File(uri).textSync();
}
