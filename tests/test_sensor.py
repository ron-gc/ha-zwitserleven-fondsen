"""Unit tests for the fund sensors."""
from datetime import date
from types import SimpleNamespace

from custom_components.zwitserleven_fondsen.sensor import (
    ZwitserlevenChangeSensor,
    ZwitserlevenPriceDateSensor,
    ZwitserlevenSensor,
)
from custom_components.zwitserleven_fondsen.const import CONF_SYMBOL, CONF_NAME

from .conftest import SYMBOL

COORDINATOR_DATA = {
    "symbol": SYMBOL,
    "long_name": "Test Fund",
    "price_date": "2026-10-02",
    "current_price": 225.87,
    "previous_close": 220.0,
    "change": 5.87,
    "change_pct": 2.67,
}


def _parts(data=COORDINATOR_DATA):
    coordinator = SimpleNamespace(
        data=None if data is None else {SYMBOL: data},
        last_update_success=True,
        async_add_listener=lambda *a, **k: None,
    )
    entry = SimpleNamespace(
        data={CONF_SYMBOL: SYMBOL, CONF_NAME: "Test Fund"},
        options={},
        title="Test Fund",
    )
    return coordinator, entry


def _sensor(data=COORDINATOR_DATA):
    return ZwitserlevenSensor(*_parts(data))


def test_exposes_symbol_and_name_attributes():
    """The card needs symbol and fund name attributes."""
    attrs = _sensor().extra_state_attributes
    assert attrs["symbol"] == SYMBOL
    assert attrs["long_name"] == "Test Fund"


def test_exposes_the_price_date():
    assert _sensor().extra_state_attributes["price_date"] == "2026-10-02"


def test_state_is_the_price_in_euro():
    sensor = _sensor()
    assert sensor.native_value == 225.87
    assert sensor.native_unit_of_measurement == "EUR"


def test_has_no_market_session_attributes():
    """One price a day: there is no market session to report."""
    attrs = _sensor().extra_state_attributes
    assert not {"market_state", "price_is_live", "traded_today"} & attrs.keys()


def test_returns_no_attributes_without_coordinator_data():
    assert _sensor(data=None).extra_state_attributes == {}


def test_change_sensor_is_the_change_in_percent():
    sensor = ZwitserlevenChangeSensor(*_parts())
    assert sensor.native_value == 2.67
    assert sensor.native_unit_of_measurement == "%"
    assert sensor.unique_id == f"zwitserleven_fondsen_{SYMBOL}_change_pct"


def test_price_date_sensor_is_the_date_the_price_is_for():
    sensor = ZwitserlevenPriceDateSensor(*_parts())
    assert sensor.native_value == date(2026, 10, 2)
    assert sensor.unique_id == f"zwitserleven_fondsen_{SYMBOL}_price_date"


def test_every_sensor_has_no_value_without_coordinator_data():
    for cls in (ZwitserlevenSensor, ZwitserlevenChangeSensor, ZwitserlevenPriceDateSensor):
        assert cls(*_parts(data=None)).native_value is None, cls.__name__
