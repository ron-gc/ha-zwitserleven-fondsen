import { LitElement, html, css, nothing, svg } from "lit";
import { query, state } from "lit/decorators.js";
import type { HomeAssistant, ZwitserlevenFondsenCardConfig, TimeRange } from "./types";
import { DOMAIN, findFundSensors, readFund } from "./fund";
import { t } from "./translations";
import { formatPrice, formatPriceDate, formatPriceDateLong } from "./format";
import { sparklinePoints, SPARKLINE_HEIGHT, SPARKLINE_WIDTH } from "./sparkline";
import { buildChartData } from "./chart-data";
import { ZwitserlevenFondsenCardEditor } from "./editor";
import { historyDialogStyles, renderHistoryDialog } from "./history-dialog";
import { RANGES, rangeLabels } from "./ranges";

const CARD_TAG = "zwitserleven-fondsen-card";
const EDITOR_TAG = "zwitserleven-fondsen-card-editor";
const LOG_PREFIX = `[${CARD_TAG}]`;

// ---------------------------------------------------------------------------
// Build identity
// ---------------------------------------------------------------------------

// Injected by vite.config.ts from custom_components/zwitserleven_fondsen/manifest.json,
// so it can never drift from the released version.
declare const __CARD_VERSION__: string;

// One line per evaluated copy of this module. The integration appends a
// ?v=<md5> cache-buster to the resource URL, so import.meta.url identifies the
// exact bundle the browser loaded — the single most useful fact when someone
// reports the card missing or behaving like an older release. Two of these
// lines means two copies are registered.
console.info(
  `${LOG_PREFIX} v${__CARD_VERSION__} loaded from ${import.meta.url}`,
);

// ---------------------------------------------------------------------------
// Card registry
// ---------------------------------------------------------------------------

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Zwitserleven Fondsen Card",
    description: "Displays Zwitserleven fund prices with sparkline charts.",
    preview: true,
  });
}

const TILE_MIN_WIDTHS: Record<string, string> = {
  small: "170px",
  medium: "220px",
  large: "280px",
};

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

const DAILY_HISTORY_TTL = 60 * 60 * 1000; // 1 h — prices change once a day

export class ZwitserlevenFondsenCard extends LitElement {
  private _hass?: HomeAssistant;
  @state() private _config?: ZwitserlevenFondsenCardConfig;
  @state() private _timeRange: TimeRange = "1T";
  /** The fund whose price history list is open, if any. */
  @state() private _historyEntityId?: string;
  @query("dialog.history-dialog") private _historyDialog?: HTMLDialogElement;

  /** Cache: symbol → { data, ts } — stored daily prices from the REST endpoint */
  private _dailyHistoryCache = new Map<string, { data: [string, number][]; ts: number }>();
  private _fetchingDaily = new Set<string>();

  public set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.requestUpdate();
  }
  public get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  public setConfig(config: ZwitserlevenFondsenCardConfig): void {
    // An empty list is allowed: the card picker adds the card with no funds
    // when none are set up yet, and the card then says how to choose them.
    if (!Array.isArray(config.entities)) {
      throw new Error(`${CARD_TAG}: 'entities' must be a list.`);
    }
    this._config = config;
    this._timeRange = config.default_range ?? "1T";
  }

  public getCardSize(): number {
    const rows = Math.ceil((this._config?.entities.length ?? 1) / 3);
    return rows * 3 + 1;
  }

  /** The card picker passes `hass`, so a new card starts with every fund already set up. */
  public static getStubConfig(hass?: HomeAssistant): ZwitserlevenFondsenCardConfig {
    return {
      type: `custom:${CARD_TAG}`,
      title: "Zwitserleven",
      entities: findFundSensors(hass).map((fund) => fund.entityId),
      default_range: "1T",
    };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TAG);
  }

  // -------------------------------------------------------------------------
  // Daily price cache (fetched from /api/zwitserleven_fondsen/history)
  // -------------------------------------------------------------------------

  private _cachedDailyHistory(symbol: string): [string, number][] | null {
    const entry = this._dailyHistoryCache.get(symbol);
    if (!entry || Date.now() - entry.ts > DAILY_HISTORY_TTL) return null;
    return entry.data;
  }

  private async _fetchDailyHistory(symbol: string): Promise<void> {
    if (this._fetchingDaily.has(symbol)) return;
    if (this._cachedDailyHistory(symbol) !== null) return;

    this._fetchingDaily.add(symbol);
    try {
      const result = await this._hass!.callApi<{ symbol: string; history: [string, number][] }>(
        "GET",
        `${DOMAIN}/history?symbol=${encodeURIComponent(symbol)}`
      );
      this._dailyHistoryCache.set(symbol, { data: result.history, ts: Date.now() });
      this.requestUpdate();
    } catch (err) {
      console.warn(`${LOG_PREFIX} daily history fetch failed for ${symbol}:`, err);
    } finally {
      this._fetchingDaily.delete(symbol);
    }
  }

  // -------------------------------------------------------------------------
  // Chart data helpers
  // -------------------------------------------------------------------------

  private _calcPeriodChange(chartData: [string, number][]): number {
    if (chartData.length < 2) return 0;
    const oldest = chartData[0][1];
    const newest = chartData[chartData.length - 1][1];

    return oldest !== 0 ? ((newest - oldest) / oldest) * 100 : 0;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  protected render() {
    if (!this._config || !this._hass) return nothing;

    const tileMinWidth = TILE_MIN_WIDTHS[this._config.tile_size ?? "small"] ?? "170px";
    const strings = t(this._hass.locale?.language ?? "en").card;

    return html`
      <ha-card>
        <div class="card-top">
          ${this._config.title
            ? html`<h1 class="card-header">${this._config.title}</h1>`
            : nothing}
          <div class="range-selector" role="group" aria-label=${strings.time_range}>
            ${RANGES.map((range) => {
              const { short, name } = rangeLabels(strings, range);
              return html`
                <button
                  class="range-btn ${this._timeRange === range ? "active" : ""}"
                  title=${name}
                  aria-label=${name}
                  aria-pressed=${this._timeRange === range ? "true" : "false"}
                  @click=${() => { this._timeRange = range; }}
                >
                  ${short}
                </button>
              `;
            })}
          </div>
        </div>
        <div class="card-content">
          ${this._config.entities.length === 0
            ? html`<p class="status">${strings.no_funds}</p>`
            : html`
              <div class="asset-grid" style="grid-template-columns: repeat(auto-fill, minmax(${tileMinWidth}, 1fr))">
                ${this._config.entities.map((entry) =>
                  this._renderEntity(entry)
                )}
              </div>
            `}
        </div>
        ${this._renderHistoryDialog()}
      </ha-card>
    `;
  }

  protected updated(): void {
    // Opened modally, the dialog blocks the page and closes on Escape.
    const dialog = this._historyDialog;
    if (dialog && !dialog.open) dialog.showModal();
  }

  private _renderEntity(entityId: string) {
    const raw = this._hass?.states[entityId];
    if (!raw) {
      return html`
        <div class="asset-tile">
          <div class="asset-header">
            <span class="asset-name">${entityId}</span>
          </div>
          <div class="status error">${t(this._hass?.locale?.language ?? "en").card.not_found}</div>
        </div>
      `;
    }

    const fund = readFund(raw);
    const displayName = fund.name;
    const locale = this._hass?.locale?.language;
    const strings = t(locale ?? "en").card;
    // Showing the stored prices of an unavailable fund would pass old numbers
    // off as current.
    if (!fund.available) {
      return this._renderUnavailableTile(entityId, displayName, strings.unavailable);
    }
    const { symbol, price } = fund;
    // Fetch the stored daily prices (no-op if cached or already in flight)
    void this._fetchDailyHistory(symbol);

    const chartData = buildChartData({
      dailyHistory: this._cachedDailyHistory(symbol) ?? [],
      range: this._timeRange,
      livePrice: price,
      priceDate: fund.priceDate,
    });
    const periodChange = this._calcPeriodChange(chartData);
    const priceDate = formatPriceDate(fund.priceDate, locale);
    const isPositive = periodChange >= 0;
    const trendColor = isPositive
      ? "var(--success-color, #4caf50)"
      : "var(--error-color, #f44336)";
    const arrow = isPositive ? "▲" : "▼";

    const refPrice = chartData.length > 0 ? chartData[0][1] : null;
    const showRef = refPrice !== null && Math.abs(refPrice - price) > 0.0001;

    return html`
      <div
        class="asset-tile"
        role="button"
        tabindex="0"
        @click=${() => this._openMoreInfo(entityId)}
        @keydown=${(e: KeyboardEvent) => this._onTileKey(e, entityId)}
      >
        <div class="asset-header">
          <span class="asset-name" title="${displayName}">${displayName}</span>
          <span class="asset-meta">
            <span class="asset-symbol">${symbol}</span>
            ${priceDate
              ? html` · <span title=${formatPriceDateLong(fund.priceDate, locale)}>${priceDate}</span>`
              : nothing}
          </span>
          <button
            class="history-btn"
            title=${strings.price_history}
            aria-label=${strings.price_history}
            @click=${(e: Event) => {
              // The tile itself opens the more-info dialog.
              e.stopPropagation();
              this._historyEntityId = entityId;
            }}
          >
            <ha-icon icon="mdi:format-list-bulleted"></ha-icon>
          </button>
        </div>
        <div class="asset-price">
          <div class="price-stack">
            <span class="price">${formatPrice(price, locale)}</span>
            ${showRef ? html`<span class="ref-price">${formatPrice(refPrice!, locale)}</span>` : nothing}
          </div>
          <span class="change" style="color:${trendColor}">
            <span class="arrow">${arrow}</span>${Math.abs(periodChange).toFixed(2)}%
          </span>
        </div>
        <div class="sparkline-wrap">
          ${this._renderSparkline(chartData, trendColor)}
        </div>
      </div>
    `;
  }

  /** A dimmed tile without price, change or sparkline; it still opens more-info. */
  private _renderUnavailableTile(entityId: string, name: string, label: string) {
    return html`
      <div
        class="asset-tile unavailable"
        role="button"
        tabindex="0"
        @click=${() => this._openMoreInfo(entityId)}
        @keydown=${(e: KeyboardEvent) => this._onTileKey(e, entityId)}
      >
        <div class="asset-header">
          <span class="asset-name" title="${name}">${name}</span>
        </div>
        <div class="asset-price">
          <span class="price">–</span>
          <span class="change">${label}</span>
        </div>
        <div class="sparkline-wrap">
          <div class="sparkline-placeholder"></div>
        </div>
      </div>
    `;
  }

  /** The price history dialog of the fund whose list button was clicked, if any. */
  private _renderHistoryDialog() {
    const entityId = this._historyEntityId;
    const raw = entityId ? this._hass?.states[entityId] : undefined;
    if (!raw) return nothing;

    const fund = readFund(raw);
    // Without a symbol (the fund became unavailable) there is nothing to look up.
    const symbol = fund.symbol;
    return renderHistoryDialog({
      fund,
      history: symbol === null ? null : this._cachedDailyHistory(symbol),
      loading: symbol !== null && this._fetchingDaily.has(symbol),
      locale: this._hass?.locale?.language,
      onClosed: () => {
        this._historyEntityId = undefined;
      },
    });
  }

  /** Enter and Space open a focused tile, like a click; keys on its list button are its own. */
  private _onTileKey(e: KeyboardEvent, entityId: string): void {
    if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
    // Space would also scroll the page.
    e.preventDefault();
    this._openMoreInfo(entityId);
  }

  private _openMoreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  private _renderSparkline(history: [string, number][], color: string) {
    if (history.length === 0) return nothing;

    const points = sparklinePoints(history)
      .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

    return svg`
      <svg viewBox="0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}" preserveAspectRatio="none" class="sparkline-svg" aria-hidden="true">
        <polyline
          points="${points}"
          fill="none"
          stroke="${color}"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  static styles = [historyDialogStyles, css`
    ha-card { height: 100%; }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 0;
      gap: 8px;
    }
    .card-header {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color);
      flex: 1 1 auto;
    }
    .range-selector {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .range-btn {
      background: none;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--secondary-text-color);
      line-height: 1.6;
    }
    .range-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }

    .card-content { padding: 10px 16px 16px; }

    .asset-grid {
      display: grid;
      gap: 10px;
    }
    .asset-tile {
      background: var(--secondary-background-color);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      cursor: pointer;
      transition: filter 0.15s ease;
    }
    .asset-tile:hover {
      filter: brightness(1.08);
    }
    .asset-tile:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .asset-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
    }
    .asset-name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .asset-meta {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .asset-symbol {
      font-family: monospace;
    }
    .history-btn {
      flex-shrink: 0;
      align-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      margin: -3px -4px -3px 0;
      padding: 0;
      border: none;
      border-radius: 4px;
      background: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      --mdc-icon-size: 16px;
    }
    .history-btn:hover,
    .history-btn:focus-visible {
      color: var(--primary-color);
      background: var(--divider-color);
    }
    .asset-price {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
    }
    .price-stack {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .price {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
    }
    .ref-price {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .change {
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .arrow { font-size: 0.7rem; }
    .sparkline-wrap { margin-top: 5px; }
    .sparkline-svg,
    .sparkline-placeholder {
      width: 100%;
      height: 40px;
      display: block;
    }
    .asset-tile.unavailable {
      opacity: 0.6;
    }
    .asset-tile.unavailable .change {
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .status {
      font-size: 0.78rem;
      padding: 6px 0;
    }
    .error { color: var(--error-color, #f44336); }
  `];
}

/**
 * Define `tag` unless something else already claimed it.
 *
 * A bare customElements.define() throws NotSupportedError on the second
 * evaluation, which breaks the rest of this module. Swallowing that silently
 * is worse though: the *first* copy loaded wins, so a user with a stale
 * duplicate resource (e.g. a leftover /local/zwitserleven-fondsen-card.js from a manual
 * install) keeps running the old card after upgrading, with nothing anywhere
 * to explain it. The warning names the copy that lost.
 */
function defineOnce(tag: string, ctor: CustomElementConstructor): void {
  if (customElements.get(tag)) {
    console.warn(
      `${LOG_PREFIX} <${tag}> is already registered by another copy of ` +
        `this card, so this copy was ignored: ${import.meta.url}. The copy ` +
        `that loaded first wins, which may be an older build. Check Settings ` +
        `> Dashboards > three-dot menu > Resources for a duplicate entry ` +
        `(a leftover /local/${CARD_TAG}.js is the usual cause) and ` +
        `remove it.`,
    );
    return;
  }
  customElements.define(tag, ctor);
}

defineOnce(EDITOR_TAG, ZwitserlevenFondsenCardEditor);
defineOnce(CARD_TAG, ZwitserlevenFondsenCard);

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
  interface HTMLElementTagNameMap {
    "zwitserleven-fondsen-card": ZwitserlevenFondsenCard;
    "zwitserleven-fondsen-card-editor": ZwitserlevenFondsenCardEditor;
  }
}
