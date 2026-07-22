// アプリのアイコン・スプラッシュ画像を、アプリ本体と同じシール図形＆パステル配色で生成する。
//   node scripts/generate-assets.mjs
// 出力: assets/icon.png / assets/adaptive-icon.png / assets/splash-icon.png
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(scriptDir, "..", "assets");

// アプリの StickerShape と同じ 44x44 図形。指定位置・拡大率で置く。
function star(c1 = "#F4D58D", c2 = "#ffffff") {
  return `<path d="M22 3 L27 16 L41 17 L30 26 L34 40 L22 32 L10 40 L14 26 L3 17 L17 16 Z" fill="${c1}" stroke="${c2}" stroke-width="1.2"/>`;
}
function flower(c1 = "#E8B4BC", c2 = "#F4D58D") {
  return `<g>
    <ellipse cx="22" cy="12" rx="7" ry="9" fill="${c1}"/>
    <ellipse cx="22" cy="32" rx="7" ry="9" fill="${c1}"/>
    <ellipse cx="12" cy="22" rx="9" ry="7" fill="${c1}"/>
    <ellipse cx="32" cy="22" rx="9" ry="7" fill="${c1}"/>
    <ellipse cx="14" cy="14" rx="7" ry="6" fill="${c1}" opacity="0.9" transform="rotate(-40 14 14)"/>
    <ellipse cx="30" cy="14" rx="7" ry="6" fill="${c1}" opacity="0.9" transform="rotate(40 30 14)"/>
    <ellipse cx="14" cy="30" rx="7" ry="6" fill="${c1}" opacity="0.9" transform="rotate(40 14 30)"/>
    <ellipse cx="30" cy="30" rx="7" ry="6" fill="${c1}" opacity="0.9" transform="rotate(-40 30 30)"/>
    <circle cx="22" cy="22" r="6.5" fill="${c2}"/>
  </g>`;
}
function heart(c1 = "#E8B4BC") {
  return `<path d="M22 38 C6 27 4 16 12 10 C18 6 22 11 22 14 C22 11 26 6 32 10 C40 16 38 27 22 38 Z" fill="${c1}"/>`;
}
function sparkle(c1 = "#F4D58D") {
  return `<path d="M22 2 C23 14 24 20 42 22 C24 24 23 30 22 42 C21 30 20 24 2 22 C20 20 21 14 22 2 Z" fill="${c1}"/>`;
}

/** 44座標の図形を (x,y) 中心・scale倍・rot度 で置く */
function place(shape, x, y, scale, rot = 0) {
  const half = 22 * scale;
  return `<g transform="translate(${x - half} ${y - half}) scale(${scale}) rotate(${rot} 22 22)">${shape}</g>`;
}

/** デコのかたまり（花＋星＋きらめき＋ハート） */
function decoCluster(cx, cy, s) {
  return `
    ${place(flower("#C9B6E4", "#fdf7f3"), cx, cy, s * 8)}
    ${place(star("#F4D58D", "#ffffff"), cx + 150 * s, cy - 150 * s, s * 4.2, 8)}
    ${place(sparkle("#F4D58D"), cx - 150 * s, cy + 140 * s, s * 3.2)}
    ${place(heart("#E8B4BC"), cx + 150 * s, cy + 150 * s, s * 3)}
  `;
}

function iconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#C9B6E4"/>
        <stop offset="0.5" stop-color="#E8B4BC"/>
        <stop offset="1" stop-color="#A8E6CF"/>
      </linearGradient>
      <radialGradient id="glow" cx="300" cy="240" r="620" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <rect width="1024" height="1024" fill="url(#glow)"/>
    <rect x="292" y="252" width="440" height="520" rx="46" fill="#FBF7F2" opacity="0.92" transform="rotate(-5 512 512)"/>
    ${decoCluster(512, 512, 1)}
  </svg>`;
}

function logoSvg(size) {
  // 適応アイコン／スプラッシュ用：背景透過、モチーフをセーフゾーン内に収める
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${decoCluster(512, 512, 0.62)}
  </svg>`;
}

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(assetsDir, name));
  console.log(`✓ assets/${name}`);
}

await render(iconSvg(1024), 1024, "icon.png");
await render(logoSvg(1024), 1024, "adaptive-icon.png");
await render(logoSvg(512), 512, "splash-icon.png");
console.log("done");
