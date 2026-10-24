import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistant, ZwitserlevenFondsenCardConfig } from "./types";
import { findFundSensors, type Fund } from "./fund";
import { RANGES } from "./ranges";
import { t } from "./translations";

// ---------------------------------------------------------------------------
// Card editor: title, default range, tile size, and the funds in their order.
// The card module defines the element.
// ---------------------------------------------------------------------------

export class ZwitserlevenFondsenCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: ZwitserlevenFondsenCardConfig;
  @state() private _dragIndex: number | null = null;

  setConfig(config: ZwitserlevenFondsenCardConfig): void {
    this._config = config;
  }

  /** The fund name from Zwitserleven, else its ID. */
  private _sensorName(fund: Fund): string {
    return fund.longName ?? fund.symbol ?? fund.entityId;
  }

  // ---- Drag & Drop --------------------------------------------------------

  private _onDragStart(e: DragEvent, index: number): void {
    this._dragIndex = index;
    e.dataTransfer!.effectAllowed = "move";
  }

  private _onDragOver(e: DragEvent, index: number): void {
    e.preventDefault();
    if (this._dragIndex === null || this._dragIndex === index) return;
    const entities = [...(this._config?.entities ?? [])];
    const [moved] = entities.splice(this._dragIndex, 1);
    entities.splice(index, 0, moved);
    this._dragIndex = index;
    this._set("entities", entities);
  }

  private _onDragEnd(): void {
    this._dragIndex = null;
  }

  // ---- Render -------------------------------------------------------------

  protected render() {
    if (!this._config) return nothing;
    const { title, default_range, entities = [] } = this._config;
    const all = findFundSensors(this.hass);
    const selectedIds = entities;
    const available = all.filter((fund) => !selectedIds.includes(fund.entityId));
    const s = t(this.hass?.locale?.language ?? "en").editor;

    return html`
      <div class="editor">
        <ha-textfield
          label=${s.title_label}
          .value=${title ?? ""}
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value.trim();
            this._set("title", v || undefined);
          }}
        ></ha-textfield>

        <div class="field-label">${s.default_range}</div>
        <div class="range-picker">
          ${RANGES.map(
            ({ value, label }) => html`
              <button
                class="range-opt ${(default_range ?? "1T") === value ? "active" : ""}"
                @click=${() => this._set("default_range", value)}
              >${label}</button>
            `
          )}
        </div>

        <div class="field-label">${s.tile_size}</div>
        <div class="range-picker">
          ${(["small", "medium", "large"] as const).map((size) => html`
            <button
              class="range-opt ${(this._config?.tile_size ?? "small") === size ? "active" : ""}"
              @click=${() => this._set("tile_size", size)}
            >${size === "small" ? "S" : size === "medium" ? "M" : "L"}</button>
          `)}
        </div>

        ${entities.length > 0 ? html`
          <div class="section-label">${s.selected} <span class="hint-inline">— ${s.drag_hint}</span></div>
          <div class="selected-list">
            ${entities.map((entityId, index) => {
              const fund = all.find((f) => f.entityId === entityId);
              const name = fund ? this._sensorName(fund) : entityId;
              const symbol = fund?.symbol ?? "";
              return html`
                <div
                  class="selected-row ${this._dragIndex === index ? "dragging" : ""}"
                  @dragover=${(e: DragEvent) => this._onDragOver(e, index)}
                >
                  <span
                    class="drag-handle"
                    draggable="true"
                    @dragstart=${(e: DragEvent) => this._onDragStart(e, index)}
                    @dragend=${() => this._onDragEnd()}
                  >⠿</span>
                  <span class="sensor-name">${name}</span>
                  <span class="sensor-meta">${symbol}</span>
                  <button class="remove-btn" @click=${() => this._removeEntity(entityId)}>✕</button>
                </div>
              `;
            })}
          </div>
        ` : nothing}

        ${all.length === 0
          ? html`<p class="hint">${s.no_sensors}<br />${s.setup_hint}</p>`
          : available.length > 0 ? html`
              <div class="section-label">${s.add}</div>
              ${available.map((fund) => html`
                <label class="sensor-row">
                  <input type="checkbox" .checked=${false} @change=${() => this._addEntity(fund.entityId)} />
                  <span class="sensor-name">${this._sensorName(fund)}</span>
                  <span class="sensor-meta">${fund.symbol} · ${fund.entityId}</span>
                </label>
              `)}
            ` : nothing}
      </div>
    `;
  }

  private _set(key: keyof ZwitserlevenFondsenCardConfig, value: unknown): void {
    const config = { ...this._config!, [key]: value } as ZwitserlevenFondsenCardConfig;
    if (value === undefined) delete (config as Record<string, unknown>)[key];
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config } }));
  }

  private _addEntity(entityId: string): void {
    const current = this._config?.entities ?? [];
    this._set("entities", [...current, entityId]);
  }

  private _removeEntity(entityId: string): void {
    const current = this._config?.entities ?? [];
    this._set("entities", current.filter((e) => e !== entityId));
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }
    ha-textfield {
      display: block;
      width: 100%;
    }
    .field-label {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
    .range-picker {
      display: flex;
      gap: 6px;
    }
    .range-opt {
      flex: 1;
      padding: 6px 0;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: none;
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .range-opt.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font-weight: 600;
    }
    .section-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-top: 8px;
      padding-bottom: 2px;
      border-bottom: 1px solid var(--divider-color);
    }
    .hint-inline {
      font-weight: 400;
      font-size: 0.78rem;
    }
    .selected-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .selected-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: var(--secondary-background-color);
      user-select: none;
    }
    .selected-row.dragging {
      opacity: 0.4;
    }
    .drag-handle {
      font-size: 1.1rem;
      color: var(--secondary-text-color);
      cursor: grab;
      flex-shrink: 0;
    }
    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 0.8rem;
      padding: 2px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
    }
    .remove-btn:hover {
      color: var(--error-color, #f44336);
    }
    .sensor-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      cursor: pointer;
      border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.06));
    }
    .sensor-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .sensor-name {
      font-size: 0.88rem;
      color: var(--primary-text-color);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sensor-meta {
      font-size: 0.72rem;
      color: var(--secondary-text-color);
      font-family: monospace;
      flex-shrink: 0;
    }
    .hint {
      font-size: 0.82rem;
      color: var(--secondary-text-color);
      line-height: 1.5;
      margin: 4px 0;
    }
  `;
}
