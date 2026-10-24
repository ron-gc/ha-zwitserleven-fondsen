// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import "./zwitserleven-fondsen-card";
import type { ZwitserlevenFondsenCard } from "./zwitserleven-fondsen-card";
import type { HomeAssistant } from "./types";

const A = "sensor.asn_duurzaam_aandelenfonds";
const B = "sensor.asn_duurzaam_obligatiefonds";

beforeAll(() => {
  // Dates of the current year are shown without the year.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 17));
});

function state(entityId: string, value: string, attributes: Record<string, unknown> = {}) {
  return { entity_id: entityId, state: value, attributes, last_changed: "", last_updated: "" };
}

function makeHass(): HomeAssistant {
  const fund = (symbol: string) => ({ symbol, long_name: symbol, price_date: "2026-10-09" });
  const entry = (id: string, device: string, key: string) => ({
    entity_id: id,
    platform: "zwitserleven_fondsen",
    device_id: device,
    translation_key: key,
  });
  return {
    states: {
      [A]: state(A, "210", fund("LTAAF")),
      // 10 units of A.
      [`${A}_value`]: state(`${A}_value`, "2100"),
      [B]: state(B, "25", fund("LTAOB")),
    },
    entities: {
      [A]: entry(A, "device-a", "price"),
      [`${A}_value`]: entry(`${A}_value`, "device-a", "value"),
      [B]: entry(B, "device-b", "price"),
    },
    locale: { language: "en" },
    callService: vi.fn(),
    // The day before the price date, for both funds.
    callApi: vi.fn().mockImplementation(async (_method: string, path: string) => ({
      symbol: "",
      history: [["2026-10-08", path.includes("LTAAF") ? 200 : 24]],
    })),
  } as unknown as HomeAssistant;
}

async function render(title?: string): Promise<ZwitserlevenFondsenCard> {
  const card = document.createElement("zwitserleven-fondsen-card");
  card.setConfig({ type: "custom:zwitserleven-fondsen-card", entities: [A, B], title });
  card.hass = makeHass();
  document.body.appendChild(card);
  await card.updateComplete;
  // Let the history requests resolve, then render with them.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await card.updateComplete;
  return card;
}

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, " ").trim();

describe("value of the units held", () => {
  it("shows the value on the tile of a fund with units held only", async () => {
    const card = await render();
    const [a, b] = card.shadowRoot!.querySelectorAll(".asset-tile");

    expect(text(a.querySelector(".asset-value"))).toBe("Value €2,100.00");
    expect(b.querySelector(".asset-value")).toBeNull();
  });

  it("shows the total and its change over the range in the header", async () => {
    const card = await render("Pension");
    const total = card.shadowRoot!.querySelector(".total-value")!;

    // 10 units went from 200 to 210; fund B has no units, so it is left out.
    expect(text(total)).toBe("€2,100.00 ▲5.00%");
    expect(total.getAttribute("title")).toBe("Total value");
    expect(total.classList.contains("grow")).toBe(false);
  });

  it("puts the total in the title's place without a title", async () => {
    const card = await render();
    expect(card.shadowRoot!.querySelector(".total-value")!.classList.contains("grow")).toBe(true);
  });
});
