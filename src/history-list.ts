// ---------------------------------------------------------------------------
// Rows of the price history list (pure, no DOM — unit-testable)
// ---------------------------------------------------------------------------

export interface HistoryRow {
  /** "YYYY-MM-DD" the price was published for. */
  date: string;
  price: number;
  /** Change against the stored price before it; null for the oldest price. */
  change: number | null;
  /** The same change in percent; null for the oldest price or a zero baseline. */
  changePct: number | null;
}

/** One row per stored daily price, newest first, from prices oldest first. */
export function historyRows(prices: [string, number][]): HistoryRow[] {
  return prices
    .map(([date, price], i): HistoryRow => {
      if (i === 0) return { date, price, change: null, changePct: null };
      const previous = prices[i - 1][1];
      return {
        date,
        price,
        change: price - previous,
        changePct: previous !== 0 ? ((price - previous) / previous) * 100 : null,
      };
    })
    .reverse();
}
