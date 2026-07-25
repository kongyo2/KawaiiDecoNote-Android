import { clamp } from "./format";

type Rgb = [number, number, number];

// #abc / #aabbcc / #aabbccdd を受け取る（アルファは無視する）。
// 解釈できない文字列は null。
function toRgb(hex: string): Rgb | null {
  const raw = hex.trim().replace(/^#/, "");
  const body = raw.length === 3 || raw.length === 4 ? raw.slice(0, 3) : raw.length >= 6 ? raw.slice(0, 6) : null;
  if (body === null || !/^[0-9a-fA-F]+$/.test(body)) return null;
  const pairs =
    body.length === 3
      ? [body[0]! + body[0]!, body[1]! + body[1]!, body[2]! + body[2]!]
      : [body.slice(0, 2), body.slice(2, 4), body.slice(4, 6)];
  return pairs.map((p) => parseInt(p, 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

// a と b を t（0=a, 1=b）で混ぜる。解釈できない色は a をそのまま返す。
export function mix(a: string, b: string, t: number): string {
  const from = toRgb(a);
  const to = toRgb(b);
  if (!from || !to) return a;
  const amount = clamp(t, 0, 1);
  return toHex([0, 1, 2].map((i) => from[i]! + (to[i]! - from[i]!) * amount) as Rgb);
}

export function lighten(hex: string, t: number): string {
  return mix(hex, "#FFFFFF", t);
}

export function darken(hex: string, t: number): string {
  return mix(hex, "#000000", t);
}

// WCAG の相対輝度（0=黒, 1=白）。解釈できない色は「明るい」とみなす。
export function relativeLuminance(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// 表紙の色は白〜黄〜灰まで幅があるので、その上に白文字を載せてよいかを
// 輝度で判断する（淡い色の上の白文字は読めないため）。
export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.5;
}
