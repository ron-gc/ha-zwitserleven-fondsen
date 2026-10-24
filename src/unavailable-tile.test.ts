// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import "./zwitserleven-fondsen-card";
import type { ZwitserlevenFondsenCard } from "./zwitserleven-fondsen-card";
import type { HomeAssistant } from "./types";

const ENTITY_ID = "sensor.asn_duurzaam_aandelenfonds";

function makeHass(state: string, attributes: Record<string, unknown>): HomeAssistant {
  return {
    states: {
      [ENTITY_ID]: { entity_id: ENTITY_ID, state, attributes, last_changed: "", last_updated: "" },
    },
    locale: { language: "en" },
    callService: vi.fn(),
    callApi: vi.fn().mockResolvedValue({
      symbol: "LTAAF",
      history: [
        ["2026-10-07", 205],
        ["2026-10-08", 200],
      ],
    }),
  } as unknown as HomeAssistant;
}

async function render(hass: HomeAssistant): Promise<ZwitserlevenFondsenCard> {
  const card = document.createElement("zwitserleven-fondsen-card");
  card.setConfig({ type: "custom:zwitserleven-fondsen-card", entities: [ENTITY_ID] });
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await card.updateComplete;
  return card;
}

const tile = (card: ZwitserlevenFondsenCard) =>
  card.shadowRoot!.querySelector<HTMLElement>(".asset-tile")!;

describe("unavailable fund", () => {
  // Home Assistant keeps only the friendly name of an unavailable sensor.
  const unavailable = () =>
    makeHass("unavailable", { friendly_name: "ASN Duurzaam Aandelenfonds" });

  it("shows a dimmed tile without price, change or sparkline", async () => {
    const card = await render(unavailable());

    expect(tile(card).classList.contains("unavailable")).toBe(true);
    const text = tile(card).textContent!.replace(/\s+/g, " ");
    expect(text).toContain("ASN Duurzaam Aandelenfonds");
    expect(text).toContain("Unavailable");
    expect(text).not.toContain("%");
    expect(tile(card).querySelector("svg")).toBeNull();
    expect(tile(card).querySelector(".history-btn")).toBeNull();
  });

  it("does not ask for stored prices without a symbol", async () => {
    const hass = unavailable();
    await render(hass);

    expect(hass.callApi).not.toHaveBeenCalled();
  });

  it("still opens the more-info dialog", async () => {
    const card = await render(unavailable());
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);

    tile(card).click();

    expect(moreInfo.mock.calls[0][0].detail).toEqual({ entityId: ENTITY_ID });
  });

  it("shows the normal tile again once the price is back", async () => {
    const card = await render(
      makeHass("210", {
        friendly_name: "ASN Duurzaam Aandelenfonds",
        symbol: "LTAAF",
        long_name: "ASN Duurzaam Aandelenfonds",
        price_date: "2026-10-09",
      }),
    );

    expect(tile(card).classList.contains("unavailable")).toBe(false);
    expect(tile(card).querySelector("svg")).not.toBeNull();
  });
});
