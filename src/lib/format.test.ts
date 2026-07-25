import { afterEach, describe, expect, it, vi } from "vitest";
import { clamp, degrees, fileStamp, pad2, randomBetween, randomOf, safeFileName, todayStamp } from "./format";

describe("pad2", () => {
  it("2桁未満はゼロ埋めする", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(5)).toBe("05");
    expect(pad2(9)).toBe("09");
  });

  it("2桁以上はそのまま文字列化する", () => {
    expect(pad2(10)).toBe("10");
    expect(pad2(42)).toBe("42");
    expect(pad2(100)).toBe("100");
  });
});

describe("todayStamp / fileStamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("todayStamp は YYYY-MM-DD 形式（月日ゼロ埋め）", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 5, 9, 3)); // 2026-07-05 09:03
    expect(todayStamp()).toBe("2026-07-05");
  });

  it("fileStamp は YYYYMMDD-HHMM 形式（時分ゼロ埋め）", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 0, 7)); // 2026-12-31 00:07
    expect(fileStamp()).toBe("20261231-0007");
  });
});

describe("randomOf", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("空配列では undefined を返す", () => {
    expect(randomOf([])).toBeUndefined();
  });

  it("Math.random に応じた要素を返す", () => {
    const arr = ["a", "b", "c", "d"] as const;
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(randomOf(arr)).toBe("a");
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(randomOf(arr)).toBe("d");
  });

  it("返す値は必ず配列の要素", () => {
    const arr = [10, 20, 30];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(randomOf(arr));
    }
  });
});

describe("clamp", () => {
  it("範囲内はそのまま", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("下限・上限で丸める", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("境界値はそのまま", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("degrees", () => {
  it("ラジアンを度に変換する", () => {
    expect(degrees(Math.PI)).toBeCloseTo(180);
    expect(degrees(Math.PI / 2)).toBeCloseTo(90);
    expect(degrees(0)).toBe(0);
  });
});

describe("randomBetween", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("min 以上 max 未満に収まる", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(randomBetween(10, 20)).toBe(10);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(randomBetween(10, 20)).toBe(15);
  });

  it("max が min 以下でも min を返す（幅は負にしない）", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    expect(randomBetween(30, 10)).toBe(30);
  });
});

describe("safeFileName", () => {
  it("ファイル名に使えない文字を _ にする", () => {
    expect(safeFileName('a/b:c*d?e"f<g>h|i', "techo")).toBe("a_b_c_d_e_f_g_h_i");
  });

  it("前後の空白は落とす", () => {
    expect(safeFileName("  ページ  ", "techo")).toBe("ページ");
  });

  it("空・空白のみ・ドットだけなら fallback", () => {
    expect(safeFileName("", "techo")).toBe("techo");
    expect(safeFileName("   ", "techo")).toBe("techo");
    expect(safeFileName("..", "techo")).toBe("techo");
  });
});
