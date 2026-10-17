import { describe, it, expect } from "vitest";
import { historyRows } from "./history-list";

describe("historyRows", () => {
  it("lists the newest price first, each against the price before it", () => {
    const rows = historyRows([
      ["2026-10-07", 200],
      ["2026-10-08", 210],
      ["2026-10-09", 199.5],
    ]);

    expect(rows.map((r) => r.date)).toEqual(["2026-10-09", "2026-10-08", "2026-10-07"]);
    expect(rows[0].change).toBeCloseTo(-10.5);
    expect(rows[0].changePct).toBeCloseTo(-5);
    expect(rows[1]).toEqual({ date: "2026-10-08", price: 210, change: 10, changePct: 5 });
  });

  it("has no change for the oldest price", () => {
    expect(historyRows([["2026-10-09", 225.87]])).toEqual([
      { date: "2026-10-09", price: 225.87, change: null, changePct: null },
    ]);
  });

  it("has no percentage against a zero price", () => {
    const [newest] = historyRows([
      ["2026-10-08", 0],
      ["2026-10-09", 1],
    ]);
    expect(newest.change).toBe(1);
    expect(newest.changePct).toBeNull();
  });

  it("is empty without prices", () => {
    expect(historyRows([])).toEqual([]);
  });
});
