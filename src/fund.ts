// ---------------------------------------------------------------------------
// Reading fund sensors (pure, no DOM — unit-testable)
// ---------------------------------------------------------------------------

import type { HassEntity, HomeAssistant } from "./types";

export const DOMAIN = "zwitserleven_fondsen";

interface FundState {
  entityId: string;
  /** Fund name from Zwitserleven; null while the sensor is unavailable. */
  longName: string | null;
  /** The name to show: the sensor's friendly name, else the fund name, symbol or entity ID. */
  name: string;
  /** "YYYY-MM-DD" the price is for, if known. */
  priceDate: string | undefined;
  /** NaN without a price. */
  price: number;
}

/**
 * What the card reads from one fund price sensor. While the sensor is
 * unavailable it has no price and no attributes, so also no symbol to fetch
 * the stored prices for; checking `available` narrows `symbol` to a string.
 */
export type Fund = FundState &
  (
    | { available: true; /** Fund ID, e.g. "LTAAF". */ symbol: string }
    | { available: false; symbol: string | null }
  );

/** A non-empty string attribute, or undefined. */
function text(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Read a fund price sensor's state once, with checked types. */
export function readFund(entity: HassEntity): Fund {
  const attributes = entity.attributes;
  const symbol = text(attributes["symbol"]) ?? null;
  const longName = text(attributes["long_name"]) ?? null;
  const price = parseFloat(entity.state);
  const state: FundState = {
    entityId: entity.entity_id,
    longName,
    name: text(attributes["friendly_name"]) ?? longName ?? symbol ?? entity.entity_id,
    priceDate: text(attributes["price_date"]),
    price,
  };
  return Number.isFinite(price) && symbol !== null
    ? { ...state, available: true, symbol }
    : { ...state, available: false, symbol };
}

/**
 * The price sensors of this integration, by symbol. Sensors of other
 * integrations that also have a `symbol`, and this integration's own change
 * and price date sensors (which have none), are left out.
 */
export function findFundSensors(hass: HomeAssistant | undefined): Fund[] {
  if (!hass) return [];
  const registry = hass.entities ?? {};
  return Object.values(hass.states)
    .filter((entity) => registry[entity.entity_id]?.platform === DOMAIN)
    .map(readFund)
    .filter((fund): fund is Fund & { symbol: string } => fund.symbol !== null)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}
