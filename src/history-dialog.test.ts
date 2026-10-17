// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import "./zwitserleven-fondsen-card";
import type { ZwitserlevenFondsenCard } from "./zwitserleven-fondsen-card";
import type { HomeAssistant } from "./types";

const ENTITY_ID = "sensor.asn_duurzaam_aandelenfonds";

beforeAll(() => {
  // Dates of the current year are shown without the year.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 17));
  // jsdom does not implement modal dialogs.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});

function makeHass(): HomeAssistant {
  return {
    states: {
      [ENTITY_ID]: {
        entity_id: ENTITY_ID,
        state: "210",
        attributes: {
          friendly_name: "ASN Duurzaam Aandelenfonds",
          symbol: "LTAAF",
          long_name: "ASN Duurzaam Aandelenfonds",
          price_date: "2026-10-09",
        },
        last_changed: "",
        last_updated: "",
      },
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

async function makeCard(): Promise<ZwitserlevenFondsenCard> {
  const card = document.createElement("zwitserleven-fondsen-card");
  card.setConfig({ type: "custom:zwitserleven-fondsen-card", entities: [ENTITY_ID] });
  card.hass = makeHass();
  document.body.appendChild(card);
  await card.updateComplete;
  // Let the history request resolve, then render with it.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await card.updateComplete;
  return card;
}

const $ = (card: ZwitserlevenFondsenCard, selector: string) =>
  card.shadowRoot!.querySelector<HTMLElement>(selector);

describe("price history list", () => {
  it("opens from the tile's list button, newest price first", async () => {
    const card = await makeCard();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);

    $(card, ".history-btn")!.click();
    await card.updateComplete;

    const dialog = $(card, "dialog.history-dialog") as HTMLDialogElement;
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.textContent).toContain("ASN Duurzaam Aandelenfonds");
    const rows = [...dialog.querySelectorAll("tbody tr")].map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent!.replace(/\s+/g, " ").trim()),
    );
    // The current price is merged in under its own price date.
    expect(rows).toEqual([
      ["Oct 9", "€210.00", "+€10.00 +5.00%"],
      ["Oct 8", "€200.00", "-€5.00 -2.44%"],
      ["Oct 7", "€205.00", "–"],
    ]);
    // The list button does not also open the more-info dialog.
    expect(moreInfo).not.toHaveBeenCalled();
  });

  it("closes with the close button", async () => {
    const card = await makeCard();
    $(card, ".history-btn")!.click();
    await card.updateComplete;

    $(card, ".close-btn")!.click();
    await card.updateComplete;

    expect($(card, "dialog.history-dialog")).toBeNull();
  });

  it("leaves the tile itself opening the more-info dialog", async () => {
    const card = await makeCard();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);

    $(card, ".asset-tile")!.click();

    expect(moreInfo).toHaveBeenCalledOnce();
    expect(moreInfo.mock.calls[0][0].detail).toEqual({ entityId: ENTITY_ID });
  });
});
