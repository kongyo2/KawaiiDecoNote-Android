import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

interface PickedAsset {
  uri: string;
  width?: number | undefined;
  height?: number | undefined;
}

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

export async function pickPhotoAsDataUrl(maxDim = 900, quality = 0.82): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return assetToDataUrl(asset, maxDim, quality);
}

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

export function writeTextFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.write(content);
  return file.uri;
}

export function readTextFile(uri: string): string {
  return new File(uri).textSync();
}
