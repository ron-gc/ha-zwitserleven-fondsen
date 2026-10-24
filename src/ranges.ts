import type { Strings } from "./translations";
import type { TimeRange } from "./types";

/** The card's time ranges, also offered as its default range in the editor. */
export const RANGES: TimeRange[] = ["1T", "1W", "1M", "YTD", "1J"];

/** The short label of a range button, e.g. "1Y", and its full name, e.g. "1 year". */
export function rangeLabels(strings: Strings["card"], range: TimeRange): { short: string; name: string } {
  return { short: strings[`range_${range}`], name: strings[`range_name_${range}`] };
}
