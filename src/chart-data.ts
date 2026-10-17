import type { TimeRange } from "./types";

export interface ChartDataInput {
  /** Stored daily prices as ["YYYY-MM-DD", price], oldest first, keyed by price date. */
  dailyHistory: [string, number][];
  range: TimeRange;
  /** The sensor's current price ... */
  livePrice: number;
  /** ... and the date Zwitserleven published it for. */
  priceDate?: string;
}

/** Local "YYYY-MM-DD" for `d`. */
function dayStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The day `days` days, or `years` years, before the "YYYY-MM-DD" day `day`. */
function daysBefore(day: string, days: number, years = 0): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayStr(new Date(y - years, m - 1, d - days));
}

/**
 * The daily prices with the sensor's current price merged in under its own
 * price date. The stored history normally already holds it; merging covers
 * the moment between a new price arriving and the card refetching the history.
 */
export function withLivePrice(
  input: Pick<ChartDataInput, "dailyHistory" | "livePrice" | "priceDate">,
): [string, number][] {
  const { dailyHistory, livePrice, priceDate } = input;
  if (!priceDate || !Number.isFinite(livePrice)) return dailyHistory;
  const last = dailyHistory[dailyHistory.length - 1];
  if (!last || last[0] < priceDate) return [...dailyHistory, [priceDate, livePrice]];
  if (last[0] === priceDate) return [...dailyHistory.slice(0, -1), [priceDate, livePrice]];
  return dailyHistory; // an older price than the history already has
}

/**
 * Build the chart series for the selected range from the daily prices, dated
 * by the day each price was published for, never by when it was fetched.
 *
 * Ranges count back from the latest price date rather than from today, so the
 * day or two Zwitserleven takes to publish a price doesn't shorten them.
 * 1T is the latest price against the one before it.
 */
export function buildChartData(input: ChartDataInput): [string, number][] {
  const prices = withLivePrice(input);
  if (prices.length <= 2) return prices;

  const latest = prices[prices.length - 1][0];
  const lastTwo = prices.slice(-2);
  const since = (from: string) => {
    const inRange = prices.filter(([d]) => d >= from);
    return inRange.length >= 2 ? inRange : lastTwo;
  };

  switch (input.range) {
    case "1T":
      return lastTwo;
    case "1W":
      return since(daysBefore(latest, 7));
    case "1M":
      return since(daysBefore(latest, 30));
    case "YTD": {
      // The previous year's last price is the YTD baseline.
      const jan1 = `${latest.slice(0, 4)}-01-01`;
      const before = prices.filter(([d]) => d < jan1);
      const thisYear = prices.filter(([d]) => d >= jan1);
      const series = before.length > 0 ? [before[before.length - 1], ...thisYear] : thisYear;
      return series.length >= 2 ? series : lastTwo;
    }
    case "1J":
      return since(daysBefore(latest, 0, 1));
  }
}
