// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { ZwitserlevenFondsenCard } from "./zwitserleven-fondsen-card";
import type { HassEntity, HomeAssistant } from "./types";

function sensor(entityId: string, symbol: string): HassEntity {
  return {
    entity_id: entityId,
    state: "100",
    attributes: { symbol, long_name: symbol, price_date: "2026-10-09" },
    last_changed: "",
    last_updated: "",
  };
}

function makeHass(): HomeAssistant {
  const states = {
    "sensor.fund_b": sensor("sensor.fund_b", "LTBBB"),
    "sensor.fund_a": sensor("sensor.fund_a", "LTAAA"),
    // Another integration's sensor with a symbol is not a fund.
    "sensor.stock": sensor("sensor.stock", "AAPL"),
  };
  return {
    states,
    entities: {
      "sensor.fund_b": { entity_id: "sensor.fund_b", platform: "zwitserleven_fondsen" },
      "sensor.fund_a": { entity_id: "sensor.fund_a", platform: "zwitserleven_fondsen" },
      "sensor.stock": { entity_id: "sensor.stock", platform: "other" },
    },
    locale: { language: "en" },
    callService: vi.fn(),
    callApi: vi.fn().mockResolvedValue({ symbol: "", history: [] }),
  } as unknown as HomeAssistant;
}

describe("card picker", () => {
  it("starts a new card with every fund that is set up, by symbol", () => {
    const config = ZwitserlevenFondsenCard.getStubConfig(makeHass());
    expect(config.entities).toEqual(["sensor.fund_a", "sensor.fund_b"]);
  });

  it("accepts its own stub config, also when no fund is set up", async () => {
    const hass = { ...makeHass(), states: {}, entities: {} } as HomeAssistant;
    const config = ZwitserlevenFondsenCard.getStubConfig(hass);
    expect(config.entities).toEqual([]);

    const card = document.createElement("zwitserleven-fondsen-card");
    expect(() => card.setConfig(config)).not.toThrow();
    card.hass = hass;
    document.body.appendChild(card);
    await card.updateComplete;

    // Says how to choose funds instead of showing an error.
    expect(card.shadowRoot!.querySelector(".card-content")!.textContent).toContain(
      "No funds selected",
    );
  });

  it("still rejects a config without an entities list", () => {
    const card = document.createElement("zwitserleven-fondsen-card");
    expect(() =>
      card.setConfig({ type: "custom:zwitserleven-fondsen-card" } as never),
    ).toThrow("'entities' must be a list");
  });
});
