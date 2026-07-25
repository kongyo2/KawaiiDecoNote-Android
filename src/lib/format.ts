export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// 年（数値）・月・日（各2桁ゼロ埋め文字列）を取り出す。日付スタンプ生成の共通部分。
function dateParts(now: Date): { year: number; month: string; day: string } {
  return { year: now.getFullYear(), month: pad2(now.getMonth() + 1), day: pad2(now.getDate()) };
}

export function todayStamp(): string {
  const { year, month, day } = dateParts(new Date());
  return `${year}-${month}-${day}`;
}

// 同じ日に何度書き出してもファイル名がぶつからないよう、分まで入れる。
export function fileStamp(): string {
  const now = new Date();
  const { year, month, day } = dateParts(now);
  return `${year}${month}${day}-${pad2(now.getHours())}${pad2(now.getMinutes())}`;
}

export function randomOf<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// min 以上 max 未満の乱数。シールやテキストを「だいたいこのへん」に置くのに使う。
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * Math.max(0, max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

// ファイル名に使えない文字を落とす。空になったら fallback を使う。
export function safeFileName(raw: string, fallback: string): string {
  const trimmed = raw
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/^\.+$/, "");
  return trimmed || fallback;
}
