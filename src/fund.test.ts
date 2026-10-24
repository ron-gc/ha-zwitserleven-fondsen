import { describe, expect, it } from "vitest";
import { findFundSensors, readFund } from "./fund";
import type { HassEntity, HomeAssistant } from "./types";

function entity(entityId: string, state: string, attributes: Record<string, unknown>): HassEntity {
  return { entity_id: entityId, state, attributes, last_changed: "", last_updated: "" };
}

const PRICE = entity("sensor.asn_duurzaam_aandelenfonds", "225.87", {
  friendly_name: "Aandelen",
  symbol: "LTAAF",
  long_name: "ASN Duurzaam Aandelenfonds",
  price_date: "2026-10-02",
});

describe("readFund", () => {
  it("reads an available fund", () => {
    expect(readFund(PRICE)).toEqual({
      entityId: "sensor.asn_duurzaam_aandelenfonds",
      symbol: "LTAAF",
      longName: "ASN Duurzaam Aandelenfonds",
      name: "Aandelen",
      priceDate: "2026-10-02",
      price: 225.87,
      available: true,
    });
  });

  it("reads an unavailable fund, which only has a friendly name", () => {
    const fund = readFund(
      entity("sensor.asn_duurzaam_aandelenfonds", "unavailable", { friendly_name: "Aandelen" }),
    );
    expect(fund).toMatchObject({ symbol: null, longName: null, name: "Aandelen", available: false });
    expect(fund.price).toBeNaN();
  });

  it("is not available without a symbol, even with a price", () => {
    expect(readFund(entity("sensor.x", "12.5", {})).available).toBe(false);
  });

  it("names the fund by friendly name, fund name, symbol, then entity ID", () => {
    const { friendly_name: _, ...noFriendly } = PRICE.attributes;
    expect(readFund({ ...PRICE, attributes: noFriendly }).name).toBe("ASN Duurzaam Aandelenfonds");
    expect(readFund({ ...PRICE, attributes: { symbol: "LTAAF" } }).name).toBe("LTAAF");
    expect(readFund({ ...PRICE, attributes: {} }).name).toBe("sensor.asn_duurzaam_aandelenfonds");
  });

  it("ignores attributes of the wrong type", () => {
    const fund = readFund({ ...PRICE, attributes: { symbol: 42, long_name: "", price_date: null } });
    expect(fund).toMatchObject({ symbol: null, longName: null, priceDate: undefined });
  });
});

describe("findFundSensors", () => {
  it("returns this integration's price sensors, by symbol", () => {
    const states = {
      b: entity("sensor.b", "24.56", { symbol: "LTAOB" }),
      a: entity("sensor.a", "225.87", { symbol: "LTAAF" }),
      // This integration's change sensor has no symbol.
      change: entity("sensor.a_change", "1.2", { unit_of_measurement: "%" }),
      // Another integration's sensor with a symbol.
      stock: entity("sensor.stock", "190", { symbol: "AAPL" }),
    };
    const platform = (id: string, p: string) => ({ entity_id: id, platform: p });
    const hass = {
      states: Object.fromEntries(Object.values(states).map((e) => [e.entity_id, e])),
      entities: {
        "sensor.a": platform("sensor.a", "zwitserleven_fondsen"),
        "sensor.b": platform("sensor.b", "zwitserleven_fondsen"),
        "sensor.a_change": platform("sensor.a_change", "zwitserleven_fondsen"),
        "sensor.stock": platform("sensor.stock", "other"),
      },
    } as unknown as HomeAssistant;

    expect(findFundSensors(hass).map((f) => f.entityId)).toEqual(["sensor.a", "sensor.b"]);
  });

  it("returns nothing without hass", () => {
    expect(findFundSensors(undefined)).toEqual([]);
  });
});
