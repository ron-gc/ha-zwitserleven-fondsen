"""Unit tests for ZwitserlevenConfigFlow and ZwitserlevenOptionsFlow."""
from unittest.mock import patch

import pytest
from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResultType, InvalidData
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.zwitserleven_fondsen.const import (
    DOMAIN,
    CONF_SYMBOL,
    CONF_NAME,
)
from custom_components.zwitserleven_fondsen.fondsen_page import FondsenPageError

from .conftest import make_page, quote

AANDELEN = quote(symbol="LTAAF", name="ASN Duurzaam Aandelenfonds")
OBLIGATIES = quote(symbol="LTAOB", name="ASN Duurzaam Obligatiefonds", price=24.56)
MILIEU = quote(symbol="LTAMI", name="ASN Milieu & Waterfonds", price=30.12)


@pytest.fixture(autouse=True)
def no_setup():
    """Patch out the actual HA setup so no coordinator/network calls are made."""
    with patch(
        "custom_components.zwitserleven_fondsen.async_setup", return_value=True
    ), patch(
        "custom_components.zwitserleven_fondsen.async_setup_entry", return_value=True
    ):
        yield


def _serve(*quotes, error=None):
    return patch(
        "custom_components.zwitserleven_fondsen.config_flow.get_page",
        return_value=make_page(*quotes, error=error),
    )


async def _init_flow(hass):
    return await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )


def _fund_options(result):
    selector = result["data_schema"].schema[CONF_SYMBOL]
    return selector.config["options"]


# ---------------------------------------------------------------------------
# Config flow
# ---------------------------------------------------------------------------


async def test_user_step_offers_every_fund_sorted_by_name(hass):
    with _serve(OBLIGATIES, MILIEU, AANDELEN):
        result = await _init_flow(hass)

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "user"
    assert _fund_options(result) == [
        {"value": "LTAAF", "label": "ASN Duurzaam Aandelenfonds (LTAAF)"},
        {"value": "LTAOB", "label": "ASN Duurzaam Obligatiefonds (LTAOB)"},
        {"value": "LTAMI", "label": "ASN Milieu & Waterfonds (LTAMI)"},
    ]


async def test_config_flow_creates_entry(hass):
    with _serve(AANDELEN, OBLIGATIES):
        result = await _init_flow(hass)
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {CONF_SYMBOL: "LTAAF", CONF_NAME: "Aandelen"},
        )

    assert result["type"] == FlowResultType.CREATE_ENTRY
    # The name is the title only, so there is one place to change it.
    assert result["title"] == "Aandelen"
    assert result["data"] == {CONF_SYMBOL: "LTAAF"}


async def test_title_defaults_to_the_fund_name(hass):
    with _serve(AANDELEN):
        result = await _init_flow(hass)
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {CONF_SYMBOL: "LTAAF", CONF_NAME: ""},
        )

    assert result["title"] == "ASN Duurzaam Aandelenfonds"


async def test_unknown_fund_is_rejected(hass):
    with _serve(AANDELEN):
        result = await _init_flow(hass)
        with pytest.raises(InvalidData):
            await hass.config_entries.flow.async_configure(
                result["flow_id"],
                {CONF_SYMBOL: "NOPE", CONF_NAME: ""},
            )


async def test_configured_funds_are_not_offered_again(hass):
    MockConfigEntry(domain=DOMAIN, data={CONF_SYMBOL: "LTAAF"}).add_to_hass(hass)

    with _serve(AANDELEN, OBLIGATIES):
        result = await _init_flow(hass)

    assert [o["value"] for o in _fund_options(result)] == ["LTAOB"]


async def test_aborts_when_every_fund_is_configured(hass):
    MockConfigEntry(domain=DOMAIN, data={CONF_SYMBOL: "LTAAF"}).add_to_hass(hass)

    with _serve(AANDELEN):
        result = await _init_flow(hass)

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "no_funds_left"


async def test_aborts_when_the_fund_list_cannot_be_loaded(hass):
    with _serve(error=FondsenPageError("Zwitserleven returned HTTP 503")):
        result = await _init_flow(hass)

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "cannot_connect"


# ---------------------------------------------------------------------------
# Options flow
# ---------------------------------------------------------------------------


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Obligaties",
        data={CONF_SYMBOL: "LTAOB"},
        minor_version=2,
    )
    entry.add_to_hass(hass)
    return entry


async def _rename(hass, entry, user_input):
    result = await hass.config_entries.options.async_init(entry.entry_id)
    return await hass.config_entries.options.async_configure(result["flow_id"], user_input)


async def test_options_flow_suggests_the_current_name(hass, entry):
    result = await hass.config_entries.options.async_init(entry.entry_id)

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "init"
    # Suggested, not a default: a default would come back when the field is cleared.
    (key,) = result["data_schema"].schema
    assert key.description == {"suggested_value": "Obligaties"}


async def test_options_flow_renames_the_entry(hass, entry):
    result = await _rename(hass, entry, {CONF_NAME: " Obligatiefonds "})

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert entry.title == "Obligatiefonds"
    assert entry.options == {}


async def test_clearing_the_name_restores_the_fund_name(hass, entry):
    # A cleared field is left out of the input altogether.
    with _serve(OBLIGATIES):
        await _rename(hass, entry, {})

    assert entry.title == "ASN Duurzaam Obligatiefonds"


async def test_clearing_the_name_falls_back_to_the_fund_id_without_the_page(hass, entry):
    with _serve(error=FondsenPageError("Zwitserleven returned HTTP 503")):
        await _rename(hass, entry, {CONF_NAME: ""})

    assert entry.title == "LTAOB"
