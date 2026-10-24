from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE, EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, CONF_SYMBOL, CONF_UNITS
from .coordinator import ZwitserlevenDataCoordinator

if TYPE_CHECKING:
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from . import ZwitserlevenConfigEntry

# Every update comes from the coordinator, so entities never poll on their own.
PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ZwitserlevenConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data
    entities: list[ZwitserlevenEntity] = [
        ZwitserlevenSensor(coordinator, entry),
        ZwitserlevenChangeSensor(coordinator, entry),
        ZwitserlevenPriceDateSensor(coordinator, entry),
    ]
    if units := entry.options.get(CONF_UNITS):
        entities.append(ZwitserlevenValueSensor(coordinator, entry, units))
    else:
        # The units were cleared in the options: remove the value sensor
        # rather than leave it behind as unavailable.
        registry = er.async_get(hass)
        value_id = _unique_id(entry.data[CONF_SYMBOL], ZwitserlevenValueSensor._unique_id_suffix)
        if entity_id := registry.async_get_entity_id("sensor", DOMAIN, value_id):
            registry.async_remove(entity_id)
    async_add_entities(entities)


def _unique_id(symbol: str, suffix: str) -> str:
    return f"zwitserleven_fondsen_{symbol}{suffix}"


class ZwitserlevenEntity(CoordinatorEntity[ZwitserlevenDataCoordinator], SensorEntity):
    """A sensor of one fund. The fund is the device; its icons are in icons.json."""

    _attr_has_entity_name = True
    # Appended to the unique ID of the fund; the price sensor has none.
    _unique_id_suffix = ""

    def __init__(
        self, coordinator: ZwitserlevenDataCoordinator, entry: ZwitserlevenConfigEntry
    ) -> None:
        super().__init__(coordinator)
        symbol = self._symbol = entry.data[CONF_SYMBOL]
        self._attr_unique_id = _unique_id(symbol, self._unique_id_suffix)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, symbol)},
            # The entry title is the display name, see the options flow.
            name=entry.title or symbol,
            manufacturer="Zwitserleven",
            model=symbol,
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def _fund(self) -> dict[str, Any] | None:
        return (self.coordinator.data or {}).get(self._symbol)

    @property
    def available(self) -> bool:
        return super().available and self._fund is not None


class ZwitserlevenSensor(ZwitserlevenEntity):
    """The price of one unit of the fund."""

    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_translation_key = "price"
    _attr_native_unit_of_measurement = "EUR"
    # Zwitserleven publishes prices in cents; without this a price like 55,00
    # is shown as 55.
    _attr_suggested_display_precision = 2
    # The price is the fund's main sensor, so it takes the device's name.
    _attr_name = None

    @property
    def native_value(self) -> float | None:
        return self._fund["current_price"] if self._fund else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        d = self._fund
        if not d:
            return {}
        return {
            "symbol": d["symbol"],
            "long_name": d["long_name"],
            "price_date": d["price_date"],
            "change": d["change"],
            "change_pct": d["change_pct"],
            "previous_close": d["previous_close"],
        }


class ZwitserlevenChangeSensor(ZwitserlevenEntity):
    """The change from the previous stored price, in percent.

    The same value as the price sensor's change_pct attribute, but a sensor
    gets long-term statistics and works in a numeric state trigger.
    """

    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_translation_key = "change_pct"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_suggested_display_precision = 2
    _unique_id_suffix = "_change_pct"

    @property
    def native_value(self) -> float | None:
        return self._fund["change_pct"] if self._fund else None


class ZwitserlevenPriceDateSensor(ZwitserlevenEntity):
    """The day the price is for; Zwitserleven publishes it a day or two later."""

    _attr_device_class = SensorDeviceClass.DATE
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    # Mostly useful for spotting a price that no longer changes.
    _attr_entity_registry_enabled_default = False
    _attr_translation_key = "price_date"
    _unique_id_suffix = "_price_date"

    @property
    def native_value(self) -> date | None:
        return date.fromisoformat(self._fund["price_date"]) if self._fund else None


class ZwitserlevenValueSensor(ZwitserlevenEntity):
    """What the units the user holds are worth: the price times the units.

    Only added when the units are set in the options.
    """

    _attr_device_class = SensorDeviceClass.MONETARY
    # Monetary sensors only allow the total state class.
    _attr_state_class = SensorStateClass.TOTAL
    _attr_native_unit_of_measurement = "EUR"
    _attr_suggested_display_precision = 2
    _attr_translation_key = "value"
    _unique_id_suffix = "_value"

    def __init__(
        self,
        coordinator: ZwitserlevenDataCoordinator,
        entry: ZwitserlevenConfigEntry,
        units: float,
    ) -> None:
        super().__init__(coordinator, entry)
        self._units = units

    @property
    def native_value(self) -> float | None:
        return round(self._fund["current_price"] * self._units, 2) if self._fund else None
