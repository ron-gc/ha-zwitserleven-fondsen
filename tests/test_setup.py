"""End-to-end tests: set up a config entry the way Home Assistant does."""
from datetime import timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest
from homeassistant.components.repairs import repairs_flow_manager
from homeassistant.config_entries import ConfigEntryState
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.icon import async_get_icons
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.zwitserleven_fondsen.const import (
    CONF_NAME,
    CONF_SYMBOL,
    DATA_COORDINATOR,
    DOMAIN,
)
from custom_components.zwitserleven_fondsen.diagnostics import (
    async_get_config_entry_diagnostics,
)
from custom_components.zwitserleven_fondsen.fondsen_page import FondsenPageError

from .conftest import SYMBOL, make_page, quote

HISTORY_KEY = f"zwitserleven_fondsen.{SYMBOL.lower()}.history"
UNIQUE_ID = f"zwitserleven_fondsen_{SYMBOL}"
ISSUE_ID = f"fund_missing_{SYMBOL}"


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="ASN Duurzaam Aandelenfonds",
        unique_id=UNIQUE_ID,
        data={CONF_SYMBOL: SYMBOL, CONF_NAME: ""},
    )
    entry.add_to_hass(hass)
    return entry


def _serve(*quotes, error=None):
    return patch(
        "custom_components.zwitserleven_fondsen.coordinator.get_page",
        return_value=make_page(*quotes, error=error),
    )


async def _set_up(hass, entry, hass_storage, history=None):
    """Set up the integration; returns the mocked page the coordinator reads."""
    if history is not None:
        hass_storage[HISTORY_KEY] = {"version": 1, "key": HISTORY_KEY, "data": history}
    page = make_page(quote(price=225.87))
    with patch("custom_components.zwitserleven_fondsen.coordinator.get_page", return_value=page):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    return page


def _entity_id(hass):
    return er.async_get(hass).async_get_entity_id("sensor", DOMAIN, UNIQUE_ID)


async def test_sets_up_a_price_sensor(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage, history=[["2026-10-01", 220.0]])

    assert entry.state is ConfigEntryState.LOADED
    state = hass.states.get(_entity_id(hass))
    assert float(state.state) == 225.87
    assert state.attributes["unit_of_measurement"] == "EUR"
    assert state.attributes["previous_close"] == 220.0
    assert state.attributes["friendly_name"] == "ASN Duurzaam Aandelenfonds"


async def test_each_fund_is_a_device(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage)

    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, SYMBOL), entry.entry_id
    )
    assert device is not None
    assert device.name == "ASN Duurzaam Aandelenfonds"
    assert device.manufacturer == "Zwitserleven"
    assert er.async_get(hass).async_get(_entity_id(hass)).device_id == device.id


async def test_the_sensor_icon_comes_from_icons_json(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage)

    assert er.async_get(hass).async_get(_entity_id(hass)).translation_key == "price"
    icons = await async_get_icons(hass, "entity", integrations={DOMAIN})
    assert icons[DOMAIN]["sensor"]["price"]["default"] == "mdi:chart-line"


async def _wait(hass, freezer, delta):
    freezer.tick(delta)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


async def test_sets_up_with_an_unavailable_sensor_when_the_site_is_down(
    hass, entry, freezer, issue_registry
):
    """No ConfigEntryNotReady: its retries would request the page every ~80 s."""
    page = make_page(error=FondsenPageError("Zwitserleven returned HTTP 503"))
    with patch("custom_components.zwitserleven_fondsen.coordinator.get_page", return_value=page):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.LOADED
    assert hass.states.get(_entity_id(hass)).state == "unavailable"
    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None

    # Nothing until the hourly retry, which finds the page back.
    await _wait(hass, freezer, timedelta(minutes=59))
    assert page.async_get_funds.call_count == 1

    page.async_get_funds.side_effect = None
    page.async_get_funds.return_value = {SYMBOL: quote()}
    await _wait(hass, freezer, timedelta(minutes=1))

    assert page.async_get_funds.call_count == 2
    assert float(hass.states.get(_entity_id(hass)).state) == 225.87


async def test_renaming_in_the_options_renames_the_device(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage)

    with _serve(quote()):
        hass.config_entries.async_update_entry(
            entry, options={CONF_NAME: "Aandelen"}
        )
        await hass.async_block_till_done()

    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, SYMBOL), entry.entry_id
    )
    assert device.name == "Aandelen"
    assert entry.state is ConfigEntryState.LOADED


async def test_unload(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage)

    assert await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED
    # The shared coordinator stops updating the fund.
    assert hass.data[DATA_COORDINATOR].history(SYMBOL) is None


async def test_funds_added_at_different_times_share_one_download(hass, entry, hass_storage):
    """However and whenever funds are added, each update downloads the page once."""
    page = make_page(quote(), quote(symbol="LTAOB", name="Obligaties", price=24.56))
    second = MockConfigEntry(
        domain=DOMAIN,
        title="Obligaties",
        unique_id="zwitserleven_fondsen_LTAOB",
        data={CONF_SYMBOL: "LTAOB", CONF_NAME: ""},
    )
    second.add_to_hass(hass)

    with patch("custom_components.zwitserleven_fondsen.coordinator.get_page", return_value=page):
        # Setting up the integration sets up both entries.
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        assert second.state is ConfigEntryState.LOADED

        assert entry.runtime_data is second.runtime_data
        coordinator = entry.runtime_data
        page.async_get_funds.reset_mock()

        await coordinator.async_refresh()

    assert page.async_get_funds.call_count == 1
    assert set(coordinator.data) == {SYMBOL, "LTAOB"}


async def test_sensor_goes_unavailable_when_its_fund_disappears(hass, entry, hass_storage):
    page = await _set_up(hass, entry, hass_storage)

    page.async_get_funds.return_value = {"LTAOB": quote(symbol="LTAOB")}
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()

    assert hass.states.get(_entity_id(hass)).state == "unavailable"


async def test_removing_the_fund_deletes_its_history(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage, history=[["2026-10-01", 220.0]])
    assert HISTORY_KEY in hass_storage

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()

    assert HISTORY_KEY not in hass_storage


# ---------------------------------------------------------------------------
# Repair issue for a fund that is no longer listed
# ---------------------------------------------------------------------------

async def _drop_the_fund(hass, entry, page):
    page.async_get_funds.return_value = {"LTAOB": quote(symbol="LTAOB")}
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()


async def test_missing_fund_raises_a_repair_issue(hass, entry, hass_storage, issue_registry):
    page = await _set_up(hass, entry, hass_storage)
    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None

    await _drop_the_fund(hass, entry, page)

    issue = issue_registry.async_get_issue(DOMAIN, ISSUE_ID)
    assert issue.translation_key == "fund_missing"
    assert issue.translation_placeholders == {"symbol": SYMBOL}
    assert issue.severity is ir.IssueSeverity.WARNING
    assert issue.is_fixable
    assert issue.data == {CONF_SYMBOL: SYMBOL}


async def test_a_page_that_fails_raises_no_repair_issue(
    hass, entry, hass_storage, issue_registry
):
    """Only a fund missing from a page that was read is a reason to delete it."""
    page = await _set_up(hass, entry, hass_storage)

    page.async_get_funds.side_effect = FondsenPageError("Found no funds in the fund table")
    await entry.runtime_data.async_refresh()

    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None


async def test_repair_issue_goes_when_the_fund_is_listed_again(
    hass, entry, hass_storage, issue_registry
):
    page = await _set_up(hass, entry, hass_storage)
    await _drop_the_fund(hass, entry, page)

    page.async_get_funds.return_value = {SYMBOL: quote()}
    await entry.runtime_data.async_refresh()

    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None


async def test_unloading_the_fund_deletes_its_repair_issue(
    hass, entry, hass_storage, issue_registry
):
    page = await _set_up(hass, entry, hass_storage)
    await _drop_the_fund(hass, entry, page)

    assert await hass.config_entries.async_unload(entry.entry_id)

    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None


async def _start_fix_flow(hass):
    assert await async_setup_component(hass, "repairs", {})
    return await repairs_flow_manager(hass).async_init(
        DOMAIN, context={"issue_id": ISSUE_ID}
    )


async def test_the_repair_deletes_the_fund(hass, entry, hass_storage, issue_registry):
    page = await _set_up(hass, entry, hass_storage, history=[["2026-10-01", 220.0]])
    await _drop_the_fund(hass, entry, page)

    result = await _start_fix_flow(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "confirm"
    assert result["description_placeholders"] == {"symbol": SYMBOL}

    result = await repairs_flow_manager(hass).async_configure(result["flow_id"], {})
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert hass.config_entries.async_get_entry(entry.entry_id) is None
    assert HISTORY_KEY not in hass_storage
    assert _entity_id(hass) is None
    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None


async def test_the_repair_leaves_other_funds_alone(hass, entry, hass_storage):
    second = MockConfigEntry(
        domain=DOMAIN,
        title="Obligaties",
        unique_id="zwitserleven_fondsen_LTAOB",
        data={CONF_SYMBOL: "LTAOB", CONF_NAME: ""},
    )
    second.add_to_hass(hass)
    page = make_page(quote(), quote(symbol="LTAOB"))
    with patch("custom_components.zwitserleven_fondsen.coordinator.get_page", return_value=page):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    await _drop_the_fund(hass, entry, page)

    result = await _start_fix_flow(hass)
    await repairs_flow_manager(hass).async_configure(result["flow_id"], {})
    await hass.async_block_till_done()

    assert hass.config_entries.async_get_entry(entry.entry_id) is None
    assert second.state is ConfigEntryState.LOADED


async def test_sets_up_with_a_repair_issue_when_the_fund_is_not_listed(
    hass, entry, issue_registry
):
    with _serve(quote(symbol="LTAOB")):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.LOADED
    assert hass.states.get(_entity_id(hass)).state == "unavailable"
    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is not None

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()

    assert issue_registry.async_get_issue(DOMAIN, ISSUE_ID) is None


# ---------------------------------------------------------------------------
# History endpoint
# ---------------------------------------------------------------------------


async def test_history_endpoint_serves_the_stored_prices(hass, entry, hass_storage, hass_client):
    await _set_up(hass, entry, hass_storage, history=[["2026-10-01", 220.0]])
    client = await hass_client()

    resp = await client.get(f"/api/zwitserleven_fondsen/history?symbol={SYMBOL.lower()}")

    assert resp.status == HTTPStatus.OK
    assert await resp.json() == {
        "symbol": SYMBOL,
        "history": [["2026-10-01", 220.0], ["2026-10-02", 225.87]],
    }


async def test_history_endpoint_unknown_fund(hass, entry, hass_storage, hass_client):
    await _set_up(hass, entry, hass_storage)
    client = await hass_client()

    resp = await client.get("/api/zwitserleven_fondsen/history?symbol=NOPE")

    assert resp.status == HTTPStatus.NOT_FOUND


async def test_history_endpoint_needs_a_symbol(hass, entry, hass_storage, hass_client):
    await _set_up(hass, entry, hass_storage)
    client = await hass_client()

    resp = await client.get("/api/zwitserleven_fondsen/history")

    assert resp.status == HTTPStatus.BAD_REQUEST


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------


async def test_diagnostics(hass, entry, hass_storage):
    await _set_up(hass, entry, hass_storage, history=[["2026-10-01", 220.0]])

    assert await async_get_config_entry_diagnostics(hass, entry) == {
        "entry": {
            "title": "ASN Duurzaam Aandelenfonds",
            "data": {CONF_SYMBOL: SYMBOL, CONF_NAME: ""},
            "options": {},
        },
        "coordinator": {
            "last_update_success": True,
            "last_exception": None,
            "funds": [SYMBOL],
            "missing_funds": [],
            "daily_update_utc": entry.runtime_data.update_time.isoformat(),
        },
        "fund": {
            "symbol": SYMBOL,
            "long_name": "ASN Duurzaam Aandelenfonds",
            "price_date": "2026-10-02",
            "current_price": 225.87,
            "previous_close": 220.0,
            "change": 5.87,
            "change_pct": 2.67,
        },
        "history": {"days": 2, "first": "2026-10-01", "last": "2026-10-02"},
    }


async def test_diagnostics_show_a_failed_update(hass, entry, hass_storage):
    page = await _set_up(hass, entry, hass_storage)

    page.async_get_funds.side_effect = FondsenPageError("Zwitserleven returned HTTP 503")
    await entry.runtime_data.async_refresh()

    coordinator = (await async_get_config_entry_diagnostics(hass, entry))["coordinator"]
    assert coordinator["last_update_success"] is False
    assert coordinator["last_exception"] == (
        "UpdateFailed: Could not read the fund prices from the Zwitserleven page: "
        "Zwitserleven returned HTTP 503"
    )


async def test_diagnostics_show_a_fund_missing_from_the_page(hass, entry, hass_storage):
    page = await _set_up(hass, entry, hass_storage)

    page.async_get_funds.return_value = {"LTAOB": quote(symbol="LTAOB")}
    await entry.runtime_data.async_refresh()

    diagnostics = await async_get_config_entry_diagnostics(hass, entry)
    assert diagnostics["coordinator"]["missing_funds"] == [SYMBOL]
    assert diagnostics["fund"] is None
