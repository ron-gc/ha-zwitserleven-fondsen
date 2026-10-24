// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import "./zwitserleven-fondsen-card";
import type { ZwitserlevenFondsenCard } from "./zwitserleven-fondsen-card";
import type { ZwitserlevenFondsenCardEditor } from "./editor";
import type { HomeAssistant, ZwitserlevenFondsenCardConfig } from "./types";

const A = "sensor.asn_duurzaam_aandelenfonds";
const B = "sensor.asn_duurzaam_obligatiefonds";
const C = "sensor.asn_milieu_waterfonds";

function makeHass(language = "en"): HomeAssistant {
  const fund = (entityId: string, symbol: string) => ({
    entity_id: entityId,
    state: "100",
    attributes: { symbol, long_name: symbol, price_date: "2026-10-09" },
    last_changed: "",
    last_updated: "",
  });
  return {
    states: { [A]: fund(A, "LTAAF"), [B]: fund(B, "LTAOB"), [C]: fund(C, "LTAMI") },
    entities: Object.fromEntries(
      [A, B, C].map((id) => [id, { entity_id: id, platform: "zwitserleven_fondsen" }]),
    ),
    locale: { language },
    callService: vi.fn(),
    callApi: vi.fn().mockResolvedValue({ symbol: "", history: [] }),
  } as unknown as HomeAssistant;
}

const config = (extra: Partial<ZwitserlevenFondsenCardConfig> = {}): ZwitserlevenFondsenCardConfig => ({
  type: "custom:zwitserleven-fondsen-card",
  entities: [A, B, C],
  ...extra,
});

async function renderCard(language = "en"): Promise<ZwitserlevenFondsenCard> {
  const card = document.createElement("zwitserleven-fondsen-card");
  card.setConfig(config());
  card.hass = makeHass(language);
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

async function renderEditor(language = "en"): Promise<ZwitserlevenFondsenCardEditor> {
  const editor = document.createElement("zwitserleven-fondsen-card-editor");
  editor.setConfig(config());
  editor.hass = makeHass(language);
  document.body.appendChild(editor);
  await editor.updateComplete;
  return editor;
}

const all = (el: Element, selector: string) => [...el.shadowRoot!.querySelectorAll<HTMLElement>(selector)];

describe("range buttons", () => {
  it("are labelled in the user's language, with the full name for screen readers", async () => {
    const buttons = all(await renderCard("nl"), ".range-btn");

    expect(buttons.map((b) => b.textContent!.trim())).toEqual(["1D", "1W", "1M", "YTD", "1J"]);
    expect(buttons[4].getAttribute("aria-label")).toBe("1 jaar");
    expect(buttons[4].title).toBe("1 jaar");
  });

  it("say which one is pressed", async () => {
    const card = await renderCard();
    const pressed = () => all(card, ".range-btn").map((b) => b.getAttribute("aria-pressed"));
    expect(pressed()).toEqual(["true", "false", "false", "false", "false"]);

    all(card, ".range-btn")[2].click();
    await card.updateComplete;

    expect(pressed()).toEqual(["false", "false", "true", "false", "false"]);
  });
});

describe("tiles", () => {
  it("can be focused and opened with Enter or Space", async () => {
    const card = await renderCard();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);
    const [tile] = all(card, ".asset-tile");

    expect(tile.getAttribute("role")).toBe("button");
    expect(tile.tabIndex).toBe(0);
    tile.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    tile.dispatchEvent(space);
    tile.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));

    expect(moreInfo).toHaveBeenCalledTimes(2);
    // Space would otherwise scroll the page.
    expect(space.defaultPrevented).toBe(true);
  });

  it("leave Enter on their list button to that button", async () => {
    const card = await renderCard();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);

    all(card, ".history-btn")[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(moreInfo).not.toHaveBeenCalled();
  });
});

describe("editor", () => {
  const lastConfig = (handler: ReturnType<typeof vi.fn>) =>
    handler.mock.calls[handler.mock.calls.length - 1][0].detail.config as ZwitserlevenFondsenCardConfig;

  it("moves funds with buttons, which also work on touch screens", async () => {
    const editor = await renderEditor();
    const changed = vi.fn();
    editor.addEventListener("config-changed", changed);

    all(editor, ".move-down")[0].click();
    expect(lastConfig(changed).entities).toEqual([B, A, C]);

    all(editor, ".move-up")[2].click();
    expect(lastConfig(changed).entities).toEqual([A, C, B]);
  });

  it("can't move the first fund up or the last one down", async () => {
    const editor = await renderEditor();

    expect(all(editor, ".move-up").map((b) => b.hasAttribute("disabled"))).toEqual([true, false, false]);
    expect(all(editor, ".move-down").map((b) => b.hasAttribute("disabled"))).toEqual([false, false, true]);
  });

  it("names the fund in its row buttons for screen readers", async () => {
    const editor = await renderEditor("nl");

    expect(all(editor, ".remove-btn")[0].getAttribute("aria-label")).toBe("Verwijderen: LTAAF");
    expect(all(editor, ".move-up")[1].getAttribute("aria-label")).toBe("Omhoog: LTAOB");
  });

  it("labels the default range buttons and says which is pressed", async () => {
    const editor = await renderEditor();
    const [day, , , , year] = all(editor, ".range-picker")[0].querySelectorAll("button");

    expect(year.textContent!.trim()).toBe("1Y");
    expect(year.getAttribute("aria-label")).toBe("1 year");
    expect(day.getAttribute("aria-pressed")).toBe("true");
  });
});
