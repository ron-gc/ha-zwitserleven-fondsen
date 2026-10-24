# Changelog

All notable changes to this integration are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-10-24

### Added

- Two more sensors per fund. **Change** is the change from the previous stored
  price in percent, the same value as the `change_pct` attribute but with
  long-term statistics, so it can be graphed. **Price date** is the date the
  price is for; it is a diagnostic sensor and disabled by default.

### Fixed

- The card shows an unavailable fund as a dimmed tile that says
  "Unavailable", instead of a "–" price next to a change and sparkline from
  older prices. It also no longer requests the stored prices of such a fund
  over and over.
- A fund's display name is now kept in one place, the name of its entry under
  Devices & services. Renaming it in the options now also renames the entry,
  renaming the entry renames the device, and clearing the name in the options
  restores the fund name from Zwitserleven instead of the name given when the
  fund was added. Existing funds keep the name they show now.

## [0.1.1] - 2026-10-24

### Added

- Dutch translation of the integration: the setup and options dialogs, the
  repair issue for a delisted fund, and the update error message now follow a
  Dutch Home Assistant. The card already had a Dutch translation.

### Changed

- The button of the repair for a delisted fund says **Delete fund** instead
  of **Submit**.

### Fixed

- Adding the card from the dashboard card picker no longer shows the error
  "'entities' must be a non-empty list". A new card now starts with every fund
  that is set up, and a card without funds says how to choose them.

## [0.1.0] - 2026-10-17

### Added

- A list button on each card tile opens the fund's price history: every
  stored daily price, newest first, with its change against the day before.

## [0.0.2] - 2026-10-17

### Added

- Diagnostics: download them from a fund's entry under Settings > Devices &
  services to attach to a bug report.
- A repair issue when a fund is no longer listed on the Zwitserleven page.
  Submitting it deletes the fund. It goes away by itself if the fund is listed
  again. A page from which no fund can be read at all counts as a failed
  update instead, so a page layout change does not ask to delete every fund.
- The integration declares the Platinum tier of the Home Assistant quality
  scale, with every rule recorded in `quality_scale.yaml`.

### Changed

- Requires Home Assistant 2026.10 or newer.
- The daily update no longer runs at 20:00 UTC on every installation. Each
  installation now updates at its own fixed time between 20:00 and 06:00 UTC,
  derived from its Home Assistant installation ID, to spread the load on the
  Zwitserleven website. The time is logged at startup and shown in the
  diagnostics.
- Requests for the fund page name this integration and its version in the
  User-Agent, instead of posing as a Chrome browser.
- The error shown when the fund page cannot be read is translatable.
- A fund now sets up even when the page cannot be read or does not list the
  fund, with its sensor unavailable. Before, Home Assistant retried the setup
  about every 80 seconds for as long as that lasted, each retry a request to
  Zwitserleven. Now a failed page is retried hourly, and a failed request is
  shared by all funds that set up within a minute.
- The README has use cases, supported funds, the options, automation examples
  and known limitations.
- The code passes mypy in strict mode, which CI now enforces.

### Fixed

- The fund page is parsed in the executor instead of on the event loop, so
  Home Assistant no longer stalls briefly while the page is read.

## [0.0.1] - 2026-10-10

First release as a standalone integration. It started from
[Easy Stock](https://github.com/derspe/ha-easy-stock) 0.5.1 and can be installed next to it.

### Added

- A price sensor per Zwitserleven fund, in EUR, read from the public
  [fund overview page](https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/).
- Setup dialog with a dropdown of all funds currently listed on that page.
- Each fund is a device; renaming it in the options renames the device and sensor.
- Sensor attributes `symbol`, `long_name`, `price_date`, `change`, `change_pct` and
  `previous_close`. The change is computed against the stored price of the previous day.
- Daily price history per fund, stored in Home Assistant and served to the card. It is
  deleted when the fund is removed.
- Updates at startup and every day at 20:00 UTC, with one download for all funds. A failed
  update is retried every hour until it succeeds.
- Lovelace card `custom:zwitserleven-fondsen-card`, registered automatically, with sparkline
  charts for 1D, 1W, 1M, YTD and 1Y, a visual editor and three tile sizes. Each tile shows
  the date of its current price after the fund ID.
- Charts are drawn from the stored daily prices, each under the date it was published for;
  ranges count back from the latest price date.

### Changed from Easy Stock

- Prices come from the Zwitserleven website instead of Yahoo Finance.
- Separate domain (`zwitserleven_fondsen`), card name and API endpoint, so both
  integrations can run side by side.
- No currency conversion: all funds are priced in EUR. Prices are kept to 4 decimals.
- No user-set update interval and no market-session attributes (`market_state`,
  `price_is_live`, `traded_today`), since funds have one price per day.
- Requires Home Assistant 2025.1 or newer.

[0.2.0]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.2.0
[0.1.1]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.1.1
[0.1.0]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.1.0
[0.0.2]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.0.2
[0.0.1]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.0.1
