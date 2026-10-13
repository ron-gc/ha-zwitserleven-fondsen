"""Diagnostics for a Zwitserleven fund. Nothing here is secret, so nothing is redacted."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant

from .const import CONF_SYMBOL

if TYPE_CHECKING:
    from . import ZwitserlevenConfigEntry


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ZwitserlevenConfigEntry
) -> dict[str, Any]:
    coordinator = entry.runtime_data
    symbol = entry.data[CONF_SYMBOL]
    history = coordinator.history(symbol) or []
    last_exception = coordinator.last_exception
    return {
        "entry": {
            "title": entry.title,
            "data": dict(entry.data),
            "options": dict(entry.options),
        },
        # The coordinator is shared, so this covers every configured fund.
        "coordinator": {
            "last_update_success": coordinator.last_update_success,
            "last_exception": repr(last_exception) if last_exception else None,
            "funds": coordinator.funds,
            "missing_funds": coordinator.missing_funds,
        },
        "fund": (coordinator.data or {}).get(symbol),
        "history": {
            "days": len(history),
            "first": history[0][0] if history else None,
            "last": history[-1][0] if history else None,
        },
    }
