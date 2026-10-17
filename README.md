# Zwitserleven Fondsen — Home Assistant Integration

[![Tests](https://github.com/ron-gc/ha-zwitserleven-fondsen/actions/workflows/tests.yml/badge.svg)](https://github.com/ron-gc/ha-zwitserleven-fondsen/actions/workflows/tests.yml)
[![hassfest](https://github.com/ron-gc/ha-zwitserleven-fondsen/actions/workflows/hassfest.yml/badge.svg)](https://github.com/ron-gc/ha-zwitserleven-fondsen/actions/workflows/hassfest.yml)
[![Release](https://img.shields.io/github/v/release/ron-gc/ha-zwitserleven-fondsen)](https://github.com/ron-gc/ha-zwitserleven-fondsen/releases)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2026.10%2B-41BDF5?logo=homeassistant&logoColor=white)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/github/license/ron-gc/ha-zwitserleven-fondsen)](LICENSE)

> Track Zwitserleven investment funds in Home Assistant, with a built-in Lovelace card featuring sparkline charts.

**No API key required. Fully configured through the UI — no YAML needed.**

This integration started as a fork of [Easy Stock](https://github.com/derspe/ha-easy-stock), but it is
a separate integration with its own domain (`zwitserleven_fondsen`), card
(`custom:zwitserleven-fondsen-card`) and API endpoint. Both can be installed side by side.

> [!WARNING]
> Zwitserleven offers no API for fund prices, so this integration reads them from the public
> [fund overview page](https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/)
> by parsing its HTML. It breaks when Zwitserleven changes the layout or content of that page, or
> moves it to another address. The fund sensors then become unavailable and the Home Assistant log
> shows why, until the integration is updated to match. This integration is not affiliated with
> Zwitserleven.

## Features

- **All Zwitserleven funds** — prices are read from the public
  [Zwitserleven fund overview](https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/)
- **Sensor entity per fund** — current price in EUR, daily change and the date of the price
- **One request per update** — a single download of the overview page updates every configured fund
- **History recording** — works with the HA recorder out of the box (`SensorStateClass.MEASUREMENT`)
- **Built-in Lovelace card** — auto-registered, no manual resource setup required
  - Sparkline charts for 5 time ranges: **1D · 1W · 1M · YTD · 1Y**
  - Charts use the daily prices the integration stores, dated by the day each price is for
  - **Price date** — the date of the current price, shown after the fund ID
  - **Reference price** — period baseline shown below the current price
  - **Click any tile** to open the HA sensor detail dialog
  - **Price history list** — the list button on a tile shows every stored daily price with its
    change, newest first
  - **Tile size** — choose S / M / L in the visual editor to control how many tiles fit per row
  - **Visual card editor** with drag & drop to reorder funds
- **Daily updates** — prices change at most once a day, so the page is checked when Home Assistant
  starts and once every night. Each installation checks at its own fixed time between 20:00 and
  06:00 UTC, so the Zwitserleven website doesn't get every request at once; the time is logged
  at startup and listed in the diagnostics. A failed check is retried every hour until it succeeds.
  To check right away, call the `homeassistant.update_entity` action on any fund sensor

## Use cases

- See the funds of your Zwitserleven pension or savings plan on a dashboard, next to the rest of
  your home.
- Get a notification when a fund rises or drops sharply, see [Automation examples](#automation-examples).
- Track what your holdings are worth by multiplying a price by the number of units you own.
- Look up a fund's daily prices in a list on the card, see [Price history list](#price-history-list).
- Keep a long-term price history in the Home Assistant recorder and long-term statistics.

## Supported funds

Every fund listed on the Zwitserleven
[fund overview page](https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/).
The setup dialog reads that page, so it always offers the funds Zwitserleven lists at that
moment. Funds that are not on that page, such as funds only visible after logging in to
Mijn Zwitserleven, are not supported.

## Requirements

- Home Assistant 2026.10 or newer
- Internet access (Zwitserleven website)

## Installation

This integration is not available in HACS. Install it manually:

1. Download or clone this repository
2. Copy the `custom_components/zwitserleven_fondsen/` folder into your HA config directory:
   ```
   config/
   └── custom_components/
       └── zwitserleven_fondsen/
   ```
3. Restart Home Assistant

### After updating

Restart Home Assistant, then force a fresh frontend load **once**. The update itself can still be
served out of your browser's or app's cache, which makes it look like nothing changed.

- **Browser:** **Ctrl+Shift+R** (**Cmd+Shift+R** on macOS).
- **Companion App:** look for **Reset frontend cache** in the app's own settings — on iOS under
  *Debug*, on Android under *Troubleshooting*. The exact path moves between app versions, so
  search for that wording rather than following a fixed menu path. **Then force-quit and reopen
  the app** — the reset does not necessarily take effect until the app has actually restarted.

### The card does not appear

The integration registers the card itself — as a dashboard resource when your Lovelace resources
are in storage mode (the default), and by injecting it through the frontend when they are in YAML
mode, where the resource list is read-only. You should never have to add a resource by hand.

If the card is still missing:

1. Confirm Zwitserleven Fondsen is listed under **Settings → Devices & Services**. Without a
   configured entry the integration never starts, and the card is not served at all.
2. Open your browser's developer console and reload the dashboard. The card logs one line on
   load: `[zwitserleven-fondsen-card] v0.0.1 loaded from http://<your-ha>:8123/zwitserleven_fondsen/zwitserleven-fondsen-card.js?v=…`.
   - **No such line** — the browser never loaded the file. Continue with step 3.
   - **Two such lines** — a second, probably stale copy is registered. The card also warns which
     copy was ignored. Remove the duplicate under **Settings → Dashboards → ⋮ → Resources**.
3. Check **Settings → Dashboards → ⋮ → Resources** for an entry pointing at
   `/zwitserleven_fondsen/zwitserleven-fondsen-card.js?v=…`. If it is missing, search your Home
   Assistant log for `zwitserleven_fondsen.frontend` — it records on every start whether the card
   was registered as a dashboard resource, or why it fell back to the frontend injection.
4. Force a reload past the browser and service-worker cache — see [After updating](#after-updating).
   Opening the dashboard in a private window rules caching out entirely.

If none of that helps, please [open an issue](https://github.com/ron-gc/ha-zwitserleven-fondsen/issues) and
include the console line from step 2 and the `zwitserleven_fondsen.frontend` log lines from step 3.

> **Adding the resource manually is a last resort.** If you do, use the plain URL
> `/zwitserleven_fondsen/zwitserleven-fondsen-card.js` — but note it carries no `?v=<hash>`
> cache-buster, and the file is served with a 31-day cache header. After an update you will keep
> getting the old card until you hard-refresh every browser that has it cached.

### Removal

1. Go to **Settings → Devices & Services → Zwitserleven Fondsen**.
2. For each fund, open the **⋮** menu and choose **Delete**. Removing the last fund also removes
   the card's dashboard resource.
3. Remove any `custom:zwitserleven-fondsen-card` cards from your dashboards.
4. Delete the `custom_components/zwitserleven_fondsen/` folder and restart Home Assistant.

Deleting a fund also deletes the daily prices stored for it.

## Setup

### Add a fund

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **Zwitserleven Fondsen**
3. Fill in the form:

| Field | Description |
|---|---|
| **Fund** | The fund to track, chosen from the funds currently listed on the Zwitserleven website |
| **Name** | Display name shown in the card (optional — falls back to the fund name if left empty) |

Repeat for each fund you want to track. Each fund becomes a device with one price sensor. Funds
you have already added are left out of the list.

### Options

To change a fund's display name later, go to **Settings → Devices & Services → Zwitserleven
Fondsen**, select the fund and choose **Configure**.

| Option | Description |
|---|---|
| **Name** | Display name of the fund's device and sensor. Leave empty to use the fund name from Zwitserleven |

## Sensor attributes

The sensor **state** is the current price (numeric), and the **unit of measurement** is `EUR`.

Each sensor additionally exposes the following state attributes:

| Attribute | Type | Description |
|---|---|---|
| `symbol` | string | Fund ID (e.g. `LTAAF`) |
| `long_name` | string | Full fund name from Zwitserleven |
| `price_date` | string | Date the price was published for (`YYYY-MM-DD`) |
| `change` | float | Absolute change from the previous stored price |
| `change_pct` | float | Percentage change from the previous stored price |
| `previous_close` | float | The previous stored daily price |

The change is computed against the integration's own stored history, so it is `0` until the
integration has seen at least two days of prices.

## Automation examples

### Notify when a fund drops more than 2% in a day

```yaml
automation:
  - alias: "Fund dropped more than 2%"
    triggers:
      - trigger: state
        entity_id: sensor.asn_duurzaam_aandelenfonds
        # Only when the price itself changes, not just its attributes.
        to: ~
    conditions:
      - condition: template
        value_template: "{{ trigger.to_state.attributes.change_pct | float(0) <= -2 }}"
    actions:
      - action: notify.notify
        data:
          message: >
            {{ trigger.to_state.attributes.long_name }} dropped
            {{ trigger.to_state.attributes.change_pct }}% to
            € {{ trigger.to_state.state }}.
```

### The value of your holdings

The integration knows the price of one unit, not how many units you own. A template sensor can
multiply the two; replace `123.4567` with your number of units:

```yaml
template:
  - sensor:
      - name: "ASN Duurzaam Aandelenfonds value"
        unit_of_measurement: "EUR"
        device_class: monetary
        state_class: total
        availability: "{{ has_value('sensor.asn_duurzaam_aandelenfonds') }}"
        state: "{{ (states('sensor.asn_duurzaam_aandelenfonds') | float * 123.4567) | round(2) }}"
```

## Lovelace card

The card is automatically registered when the integration loads — no manual resource
configuration needed.

### Add to dashboard

1. Edit your dashboard → **Add Card** → search for **Zwitserleven Fondsen Card**
2. Select the funds to display and configure the card using the visual editor

### Card configuration (YAML)

```yaml
type: custom:zwitserleven-fondsen-card
title: Pensioen              # optional
default_range: "1T"          # optional — 1T (1D), 1W, 1M, YTD, 1J (1Y) — default: 1T
tile_size: small             # optional — small (default), medium, large
entities:
  - sensor.asn_duurzaam_aandelenfonds
  - sensor.asn_duurzaam_obligatiefonds
```

### Time ranges

All ranges are drawn from the daily prices the integration stores, each under the date
Zwitserleven published it for, not the date it was fetched. Ranges count back from the latest
price date, so the day or two Zwitserleven takes to publish a price doesn't shorten them.

| Value | Meaning | Shows |
|---|---|---|
| `1T` | 1 Day | The latest price against the one before it |
| `1W` | 1 Week | The prices of the last 7 days |
| `1M` | 1 Month | The prices of the last 30 days |
| `YTD` | Year to date | From the last price of the previous year |
| `1J` | 1 Year | The prices of the last year |

Each tile also shows the date of its current price after the fund ID, for example
`LTAAF · 9 okt`.

> **Note:** Zwitserleven only publishes the current price, so the stored history starts on the
> day you add a fund and the charts fill up over time. With a single stored price, a chart is a
> flat line.

### Price history list

The list button in the top-right corner of a tile opens the fund's price history: one row per
stored day, newest first, with the price and its change against the day before, as an amount
and a percentage. The dates are the days Zwitserleven published the prices for, as in the
charts, and the list goes back to the day you added the fund.

## Known limitations

- **It reads a web page.** Zwitserleven has no API, so a change to the fund overview page can
  break the integration until it is updated, see the warning at the top.
- **One price per day, published late.** Zwitserleven publishes a price a day or two after the
  date it is for. The `price_date` attribute says which day the price is for.
- **Updated once a night.** Each installation checks the page at its own time between 20:00 and
  06:00 UTC. A price published after that time appears the next night, or right away when you
  call `homeassistant.update_entity` on a fund sensor.
- **History starts when you add a fund.** Zwitserleven only shows the current price, so earlier
  prices cannot be loaded.
- **Prices per unit only.** The integration does not know your holdings; see
  [The value of your holdings](#the-value-of-your-holdings).

## Troubleshooting

**The card does not appear / "Custom element doesn't exist: zwitserleven-fondsen-card"**
- See [The card does not appear](#the-card-does-not-appear) for the full checklist.

**No data / sensor unavailable**
- Check that the fund is still listed on the [Zwitserleven fund overview](https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/)
- Check the Home Assistant log, filtered on `zwitserleven_fondsen`. When the page cannot be read,
  for example because the website is down, every fund sensor is unavailable and the log says
  why. The integration tries again every hour, and the sensors come back by themselves.

**Repair: "Fund … is no longer listed by Zwitserleven"**
- The fund overview page no longer lists the fund, so its sensor is unavailable. If Zwitserleven
  closed or renamed the fund, open the repair under **Settings → Repairs** and select **Submit**
  to delete the fund. If you expect the fund to come back, leave the repair: it goes away by
  itself at the next update after the fund is listed again.
- If the page changes so that no fund can be read at all, the integration does not raise this
  repair for every fund. All fund sensors become unavailable and the log says the page could
  not be read, until the integration is updated.

**Wrong display name**
- Set a custom **Name** in the integration options (Settings → Devices & Services → Zwitserleven Fondsen → Configure)

## Development

```sh
npm ci
npm run build   # type-checks and rebuilds custom_components/zwitserleven_fondsen/www/
npm test        # card tests
pytest          # integration tests, needs Python 3.14 (see requirements_test.txt)
mypy            # strict type check
```

### Trying it out in a test Home Assistant

[dev/compose.yaml](dev/compose.yaml) starts a separate Home Assistant in Docker (Docker Desktop
works on Windows), with this integration mounted straight from the repository. It does not touch
any other Home Assistant you run.

```sh
docker compose -f dev/compose.yaml up -d     # then open http://localhost:8123
docker compose -f dev/compose.yaml restart   # after changing the integration or rebuilding the card
docker compose -f dev/compose.yaml logs -f   # follow the log; this integration logs at debug level
docker compose -f dev/compose.yaml down      # stop
```

The first start asks you to create a user. Everything the test instance stores lives in
`dev/config/`, which git ignores; delete that folder to start over from scratch.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

## License

MIT — see [LICENSE](LICENSE).
