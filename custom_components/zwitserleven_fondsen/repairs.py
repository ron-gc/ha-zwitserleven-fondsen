"""Repair flow for a fund that is no longer listed on the Zwitserleven page."""
from __future__ import annotations

from homeassistant.components.repairs import ConfirmRepairFlow, RepairsFlow, RepairsFlowResult
from homeassistant.core import HomeAssistant

from .const import CONF_SYMBOL, DOMAIN


class FundMissingRepairFlow(ConfirmRepairFlow):
    """Ask to confirm, then delete the config entry of the missing fund."""

    def __init__(self, symbol: str) -> None:
        self._symbol = symbol

    async def async_step_confirm(
        self, user_input: dict[str, str] | None = None
    ) -> RepairsFlowResult:
        if user_input is None:
            return await super().async_step_confirm()
        for entry in self.hass.config_entries.async_entries(DOMAIN):
            if entry.data.get(CONF_SYMBOL) == self._symbol:
                await self.hass.config_entries.async_remove(entry.entry_id)
        return self.async_create_entry(data={})


async def async_create_fix_flow(
    hass: HomeAssistant,
    issue_id: str,
    data: dict[str, str | int | float | None] | None,
) -> RepairsFlow:
    # The fund_missing issue is the only fixable one, and it always has data.
    assert data is not None
    return FundMissingRepairFlow(str(data[CONF_SYMBOL]))
