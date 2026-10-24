import { css, html, nothing, type TemplateResult } from "lit";
import type { Fund } from "./fund";
import { withLivePrice } from "./chart-data";
import {
  formatPercentChange,
  formatPrice,
  formatPriceChange,
  formatPriceDate,
  formatPriceDateLong,
} from "./format";
import { historyRows } from "./history-list";
import { t } from "./translations";

export interface HistoryDialogProps {
  fund: Fund;
  /** The stored daily prices, oldest first, or null while they are not fetched. */
  history: [string, number][] | null;
  /** Whether the stored prices are being fetched. */
  loading: boolean;
  locale: string | undefined;
  /** Called once the dialog has closed, however it was closed. */
  onClosed: () => void;
}

/**
 * The stored daily prices of a fund, newest first, in a <dialog>. The card
 * opens it modally once it is rendered; Escape, the close button and a click
 * on the backdrop close it.
 */
export function renderHistoryDialog({
  fund,
  history,
  loading,
  locale,
  onClosed,
}: HistoryDialogProps): TemplateResult {
  const { name, symbol } = fund;
  const strings = t(locale ?? "en").card;
  const rows = history
    ? historyRows(
        withLivePrice({
          dailyHistory: history,
          livePrice: fund.price,
          priceDate: fund.priceDate,
        }),
      )
    : null;

  let body;
  if (rows === null && loading) {
    body = html`<p class="status">${strings.loading}</p>`;
  } else if (!rows?.length) {
    body = html`<p class="status">${strings.no_history}</p>`;
  } else {
    body = html`
      <table>
        <thead>
          <tr>
            <th scope="col">${strings.date}</th>
            <th scope="col" class="num">${strings.price}</th>
            <th scope="col" class="num">${strings.change}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const trend = !row.change ? "" : row.change > 0 ? "up" : "down";
            return html`
              <tr>
                <td title=${formatPriceDateLong(row.date, locale)}>
                  ${formatPriceDate(row.date, locale)}
                </td>
                <td class="num">${formatPrice(row.price, locale)}</td>
                <td class="num ${trend}">
                  ${row.change === null
                    ? "–"
                    : html`${formatPriceChange(row.change, locale)}${row.changePct === null
                        ? nothing
                        : html` <span class="pct">${formatPercentChange(row.changePct, locale)}</span>`}`}
                </td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    `;
  }

  return html`
    <dialog
      class="history-dialog"
      aria-labelledby="history-title"
      @close=${onClosed}
      @click=${(e: Event) => {
        // Only a click on the backdrop has the dialog itself as its target.
        if (e.target === e.currentTarget) (e.currentTarget as HTMLDialogElement).close();
      }}
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-heading">
            <h2 id="history-title">${strings.price_history}</h2>
            <div class="dialog-subtitle">
              ${name}${symbol === null
                ? nothing
                : html` · <span class="asset-symbol">${symbol}</span>`}
            </div>
          </div>
          <button
            class="close-btn"
            title=${strings.close}
            aria-label=${strings.close}
            @click=${(e: Event) => (e.currentTarget as HTMLElement).closest("dialog")?.close()}
          >✕</button>
        </div>
        <div class="dialog-body">${body}</div>
      </div>
    </dialog>
  `;
}

export const historyDialogStyles = css`
    .history-dialog {
      width: min(460px, calc(100vw - 32px));
      max-height: min(640px, calc(100vh - 64px));
      padding: 0;
      border: none;
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .history-dialog[open] {
      display: flex;
    }
    .history-dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
    }
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 16px 16px 8px;
    }
    .dialog-heading {
      min-width: 0;
    }
    .dialog-heading h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .dialog-subtitle {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .close-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 1rem;
    }
    .close-btn:hover,
    .close-btn:focus-visible {
      background: var(--divider-color);
      color: var(--primary-text-color);
    }
    .dialog-body {
      overflow-y: auto;
      padding: 0 16px 12px;
    }
    .dialog-body .status {
      margin: 0;
      padding: 16px 0;
      color: var(--secondary-text-color);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    th {
      position: sticky;
      top: 0;
      background: var(--card-background-color, #fff);
      text-align: left;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      padding: 8px 4px 6px;
      border-bottom: 1px solid var(--divider-color);
    }
    td {
      padding: 6px 4px;
      border-bottom: 1px solid var(--divider-color);
      white-space: nowrap;
    }
    .num {
      text-align: right;
    }
    td.up {
      color: var(--success-color, #4caf50);
    }
    td.down {
      color: var(--error-color, #f44336);
    }
    .pct {
      display: inline-block;
      min-width: 4.5em;
      margin-left: 4px;
    }
`;
