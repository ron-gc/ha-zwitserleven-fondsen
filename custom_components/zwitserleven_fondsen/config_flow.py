from __future__ import annotations

from typing import Any

import probatio
from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

from .const import DOMAIN, CONF_SYMBOL, CONF_NAME, CONF_UNITS
from .fondsen_page import FondsenPageError, get_page


class ZwitserlevenConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1
    # 1.2: the display name is the entry title only, see async_migrate_entry.
    MINOR_VERSION = 2

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ZwitserlevenOptionsFlow:
        return ZwitserlevenOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        try:
            funds = await get_page(self.hass).async_get_funds()
        except FondsenPageError:
            return self.async_abort(reason="cannot_connect")

        if user_input is not None:
            symbol = user_input[CONF_SYMBOL]
            await self.async_set_unique_id(f"zwitserleven_fondsen_{symbol}")
            self._abort_if_unique_id_configured()

            fund = funds.get(symbol)
            # The title is the display name of the fund's device and sensor.
            return self.async_create_entry(
                title=user_input.get(CONF_NAME, "").strip() or (fund.name if fund else symbol),
                data={CONF_SYMBOL: symbol},
            )

        configured = {entry.data[CONF_SYMBOL] for entry in self._async_current_entries()}
        options = [
            SelectOptionDict(value=fund.symbol, label=f"{fund.name} ({fund.symbol})")
            for fund in sorted(funds.values(), key=lambda f: f.name.casefold())
            if fund.symbol not in configured
        ]
        if not options:
            return self.async_abort(reason="no_funds_left")

        schema = probatio.Schema(
            {
                probatio.Required(CONF_SYMBOL): SelectSelector(
                    SelectSelectorConfig(options=options, mode=SelectSelectorMode.DROPDOWN)
                ),
                probatio.Optional(CONF_NAME, default=""): str,
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema)


class ZwitserlevenOptionsFlow(config_entries.OptionsFlow):
    """Rename the fund and set the units held.

    The name is the entry title, so renaming the entry under Devices &
    services does the same. The units are the only option.
    """

    # Home Assistant sets self.config_entry on the flow itself.

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            name = user_input.get(CONF_NAME, "").strip() or await self._async_fund_name()
            units = user_input.get(CONF_UNITS)
            options = {CONF_UNITS: float(units)} if units else {}
            # One update for both, so the update listener reloads the entry
            # once; create_entry then finds the options unchanged.
            self.hass.config_entries.async_update_entry(
                self.config_entry, title=name, options=options
            )
            return self.async_create_entry(data=options)

        # Suggested values rather than defaults: a field the user clears is
        # left out of user_input, and a default would put the old value back.
        schema = self.add_suggested_values_to_schema(
            probatio.Schema(
                {
                    probatio.Optional(CONF_NAME): str,
                    probatio.Optional(CONF_UNITS): NumberSelector(
                        NumberSelectorConfig(min=0, step="any", mode=NumberSelectorMode.BOX)
                    ),
                }
            ),
            {
                CONF_NAME: self.config_entry.title,
                CONF_UNITS: self.config_entry.options.get(CONF_UNITS),
            },
        )
        return self.async_show_form(step_id="init", data_schema=schema)

    async def _async_fund_name(self) -> str:
        """The fund's name on the Zwitserleven page, or its ID if that is unavailable."""
        symbol: str = self.config_entry.data[CONF_SYMBOL]
        try:
            fund = (await get_page(self.hass).async_get_funds()).get(symbol)
        except FondsenPageError:
            return symbol
        return fund.name if fund else symbol
