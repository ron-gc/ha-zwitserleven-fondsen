import logging
from typing import Any

from aiohttp import web
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView
from homeassistant.helpers.storage import Store

from .const import CONF_SYMBOL, DATA_COORDINATOR, DOMAIN
from .coordinator import (
    History,
    ZwitserlevenDataCoordinator,
    async_delete_fund_missing_issue,
    get_coordinator,
)
from .frontend import (
    CARD_URL_BASE,
    DATA_FRONTEND,
    async_register_card,
    async_unregister_card,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor"]

type ZwitserlevenConfigEntry = ConfigEntry[ZwitserlevenDataCoordinator]


class ZwitserlevenHistoryView(HomeAssistantView):
    """REST endpoint: GET /api/zwitserleven_fondsen/history?symbol=LTAAF"""

    url = "/api/zwitserleven_fondsen/history"
    name = "api:zwitserleven_fondsen:history"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        symbol = request.query.get("symbol", "").upper().strip()
        if not symbol:
            return self.json_message("symbol parameter required", status_code=400)

        coordinator = hass.data.get(DATA_COORDINATOR)
        history = coordinator.history(symbol) if coordinator else None
        if history is not None:
            return self.json({"symbol": symbol, "history": history})

        return self.json_message(f"No sensor for symbol {symbol}", status_code=404)


async def _async_register_card_safely(hass: HomeAssistant) -> None:
    """Register the card without ever letting a card problem break setup.

    An exception raised out of a component's async_setup makes
    _async_setup_component log it and return False. The domain then never
    enters hass.config.components and *every* config entry fails, so a
    frontend detail would cost the user all of their sensors. Card
    registration reads and validates the Lovelace resource store, writes to
    it, and hashes a file that a truncated download can leave missing --
    plenty of ways to raise for something the sensors do not depend on.
    """
    try:
        await async_register_card(hass)
    except Exception:  # noqa: BLE001 - deliberately broad, see docstring
        _LOGGER.exception(
            "Zwitserleven Fondsen could not register its Lovelace card. Your sensors are "
            "unaffected and keep updating normally; only the custom card may "
            "be missing from dashboards. As a workaround, add %s as a "
            "dashboard resource of type 'module' under Settings > Dashboards > "
            "Resources",
            CARD_URL_BASE,
        )


def _history_store(hass: HomeAssistant, symbol: str) -> Store[History]:
    return Store(hass, version=1, key=f"zwitserleven_fondsen.{symbol.lower()}.history")


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Register the card and the history endpoint."""
    await _async_register_card_safely(hass)
    hass.http.register_view(ZwitserlevenHistoryView())
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ZwitserlevenConfigEntry) -> bool:
    # Removing the last config entry unregisters the card but does not unload
    # the component: ConfigEntries._async_remove never touches
    # hass.config.components, so adding an entry back afterwards takes
    # ConfigEntries.async_setup's `entry.domain in components` branch and only
    # runs entry.async_setup. The module-level async_setup above never runs
    # again, so without this the card would stay gone until a restart.
    # The guard matters: hass.http.async_register_static_paths appends to the
    # aiohttp route table on every call, so an unconditional call here would
    # add litter for every entry.
    if DATA_FRONTEND not in hass.data:
        await _async_register_card_safely(hass)

    symbol = entry.data[CONF_SYMBOL]
    coordinator = get_coordinator(hass)
    await coordinator.async_add_fund(symbol, _history_store(hass, symbol))
    # Refreshes for every fund; the page cache keeps the entries that set up
    # together at startup down to one download.
    #
    # The entry sets up even when this fails or the fund is missing, with its
    # sensor unavailable. ConfigEntryNotReady would make Home Assistant retry
    # the setup about every 80 seconds for as long as the page fails or the
    # fund stays delisted, each retry a request to Zwitserleven. Instead a
    # failed page is retried hourly, a missing fund is checked again at the
    # daily update, and the log or a repair issue tells the user why.
    await coordinator.async_refresh_with_retry()
    entry.runtime_data = coordinator
    entry.async_on_unload(lambda: _async_remove_fund(hass, coordinator, symbol))

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


def _async_remove_fund(
    hass: HomeAssistant, coordinator: ZwitserlevenDataCoordinator, symbol: str
) -> None:
    coordinator.remove_fund(symbol)
    # If the fund is still missing when the entry loads again, the next update
    # raises the issue again.
    async_delete_fund_missing_issue(hass, symbol)


async def async_unload_entry(hass: HomeAssistant, entry: ZwitserlevenConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Delete the fund's stored prices; drop the card once the last entry is gone."""
    if CONF_SYMBOL in entry.data:
        symbol = entry.data[CONF_SYMBOL]
        await _history_store(hass, symbol).async_remove()
        async_delete_fund_missing_issue(hass, symbol)
    if hass.config_entries.async_entries(DOMAIN):
        return
    await async_unregister_card(hass)
