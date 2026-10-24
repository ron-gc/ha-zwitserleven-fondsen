import type { TimeRange } from "./types";

/** The card's time ranges, also offered as its default range in the editor. */
export const RANGES: { value: TimeRange; label: string }[] = [
  { value: "1T", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "YTD", label: "YTD" },
  { value: "1J", label: "1Y" },
];
