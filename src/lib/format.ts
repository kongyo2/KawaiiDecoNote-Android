export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** YYYY-MM-DD（ローカル日付） */
export function todayStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** ファイル名用のタイムスタンプ（YYYYMMDD-HHMM） */
export function fileStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}`;
}

/** 配列からランダムに1つ選ぶ（空配列は undefined） */
export function randomOf<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
