import { describe, expect, it } from "vitest";
import { darken, isLightColor, lighten, mix, relativeLuminance } from "./color";

describe("mix", () => {
  it("t=0 なら a、t=1 なら b", () => {
    expect(mix("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(mix("#000000", "#FFFFFF", 1)).toBe("#FFFFFF");
  });

  it("中間は成分ごとに補間する", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });

  it("t は 0〜1 に丸める", () => {
    expect(mix("#000000", "#FFFFFF", -3)).toBe("#000000");
    expect(mix("#000000", "#FFFFFF", 9)).toBe("#FFFFFF");
  });

  it("3桁の短縮表記も読む", () => {
    expect(mix("#fff", "#fff", 0.5)).toBe("#FFFFFF");
  });

  it("8桁（アルファ付き）はアルファを無視する", () => {
    expect(mix("#FF000080", "#FF000080", 0)).toBe("#FF0000");
  });

  it("解釈できない色は a をそのまま返す", () => {
    expect(mix("red", "#FFFFFF", 0.5)).toBe("red");
    expect(mix("#FFFFFF", "rebeccapurple", 0.5)).toBe("#FFFFFF");
    expect(mix("#GGGGGG", "#FFFFFF", 0.5)).toBe("#GGGGGG");
    expect(mix("#12", "#FFFFFF", 0.5)).toBe("#12");
  });
});

describe("lighten / darken", () => {
  it("白・黒へ寄せる", () => {
    expect(lighten("#808080", 1)).toBe("#FFFFFF");
    expect(darken("#808080", 1)).toBe("#000000");
  });

  it("0 なら元の色", () => {
    expect(lighten("#C9B6E4", 0)).toBe("#C9B6E4");
  });
});

describe("relativeLuminance / isLightColor", () => {
  it("白は1、黒は0", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1);
    expect(relativeLuminance("#000000")).toBeCloseTo(0);
  });

  it("淡い表紙色は「明るい」、濃い色は「暗い」", () => {
    expect(isLightColor("#F4D58D")).toBe(true);
    expect(isLightColor("#CFCFCF")).toBe(true);
    expect(isLightColor("#5B4D70")).toBe(false);
  });

  it("解釈できない色は明るい扱い（白文字を避ける安全側）", () => {
    expect(relativeLuminance("nope")).toBe(1);
    expect(isLightColor("nope")).toBe(true);
  });

  it("暗い成分はガンマ補正の下側の枝を通る", () => {
    expect(relativeLuminance("#010101")).toBeGreaterThan(0);
    expect(relativeLuminance("#010101")).toBeLessThan(0.01);
  });
});
