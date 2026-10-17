import { describe, it, expect } from "vitest";
import {
  formatPercentChange,
  formatPrice,
  formatPriceChange,
  formatPriceDate,
  formatPriceDateLong,
} from "./format";

describe("formatPrice", () => {
  it("formats in euro", () => {
    expect(formatPrice(225.87, "en-US")).toBe("€225.87");
  });

  it("shows at least two decimals", () => {
    expect(formatPrice(24.5, "en-US")).toBe("€24.50");
  });

  it("shows at most four decimals", () => {
    expect(formatPrice(7.137149, "en-US")).toBe("€7.1371");
  });

  it("follows the locale's decimal separator", () => {
    expect(formatPrice(225.87, "nl-NL")).toMatch(/225,87/);
  });

  it("shows a dash for a non-numeric state", () => {
    expect(formatPrice(NaN)).toBe("–");
  });
});

describe("formatPriceDate", () => {
  const NOW = new Date(2026, 9, 10);

  it("shows day and short month", () => {
    expect(formatPriceDate("2026-10-09", "en-GB", NOW)).toBe("9 Oct");
    expect(formatPriceDate("2026-10-09", "nl-NL", NOW)).toBe("9 okt");
  });

  it("keeps the published day in every time zone", () => {
    // new Date("2026-10-09") is UTC midnight, the 8th west of Greenwich.
    expect(formatPriceDate("2026-10-09", "en-GB", NOW)).toMatch(/^9 /);
  });

  it("adds the year when it is not the current one", () => {
    expect(formatPriceDate("2025-12-31", "en-GB", NOW)).toBe("31 Dec 2025");
  });

  it("is empty for a missing or malformed date", () => {
    expect(formatPriceDate(undefined, "en-GB", NOW)).toBe("");
    expect(formatPriceDate("09-10-2026", "en-GB", NOW)).toBe("");
  });

  it("has a long form for the tooltip", () => {
    expect(formatPriceDateLong("2026-10-09", "en-GB")).toBe("9 October 2026");
    expect(formatPriceDateLong("2026-10-09", "nl-NL")).toBe("9 oktober 2026");
  });
});

describe("formatPriceChange", () => {
  it("shows the sign of a change", () => {
    expect(formatPriceChange(1.25, "en-US")).toBe("+€1.25");
    expect(formatPriceChange(-0.4, "en-US")).toBe("-€0.40");
  });

  it("shows no sign for no change", () => {
    expect(formatPriceChange(0, "en-US")).toBe("€0.00");
  });
});

describe("formatPercentChange", () => {
  it("takes percent and shows two decimals with the sign", () => {
    expect(formatPercentChange(0.554, "en-US")).toBe("+0.55%");
    expect(formatPercentChange(-5, "en-US")).toBe("-5.00%");
  });
});
