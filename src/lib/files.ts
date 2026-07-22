import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

interface PickedAsset {
  uri: string;
  width?: number | undefined;
  height?: number | undefined;
}

/** 選んだ画像を長辺 maxDim に縮小した JPEG の data URL にする（Web版と同じ埋め込み形式） */
async function assetToDataUrl(asset: PickedAsset, maxDim: number, quality: number): Promise<string | null> {
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
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
}

/** フォトライブラリから1枚選んで data URL を返す。キャンセル時は null。 */
export async function pickPhotoAsDataUrl(maxDim = 900, quality = 0.82): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return assetToDataUrl(asset, maxDim, quality);
}

/**
 * Android で写真ピッカーを開いたままアクティビティが破棄されたとき、復帰後に
 * 選択結果を拾って data URL にする（「アクティビティを保持しない」等の対策）。無ければ null。
 */
export async function recoverPendingPhotoAsDataUrl(maxDim = 900, quality = 0.82): Promise<string | null> {
  try {
    const pending = await ImagePicker.getPendingResultAsync();
    if (!pending || !("assets" in pending) || pending.canceled) return null;
    const asset = pending.assets[0];
    if (!asset) return null;
    return assetToDataUrl(asset, maxDim, quality);
  } catch {
    return null;
  }
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
