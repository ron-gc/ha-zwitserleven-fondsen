# Changelog

All notable changes to this integration are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Diagnostics: download them from a fund's entry under Settings > Devices &
  services to attach to a bug report.

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

[0.0.1]: https://github.com/ron-gc/ha-zwitserleven-fondsen/releases/tag/v0.0.1
