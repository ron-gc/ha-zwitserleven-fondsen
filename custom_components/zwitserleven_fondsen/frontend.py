"""Serve and register the Zwitserleven Fondsen Lovelace card."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA, MODE_STORAGE
from homeassistant.core import HomeAssistant
from homeassistant.helpers.collection import ItemNotFound

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CARD_FILENAME = "zwitserleven-fondsen-card.js"
CARD_URL_BASE = f"/{DOMAIN}/{CARD_FILENAME}"
DATA_FRONTEND = f"{DOMAIN}_frontend"


def _card_dir() -> Path:
    return Path(__file__).parent / "www"


def _file_hash() -> str:
    return hashlib.md5((_card_dir() / CARD_FILENAME).read_bytes()).hexdigest()[:8]


def _writable_resources(hass: HomeAssistant):
    """Return the Lovelace resource collection if it can be written to.

    Every rejection is logged with its reason, so a user's log export tells
    "YAML resource mode" apart from "Lovelace missing" instead of leaving
    them looking identical.
    """
    data = hass.data.get(LOVELACE_DATA)
    if data is None:
        _LOGGER.warning(
            "Lovelace data is not available, so the Zwitserleven Fondsen card cannot be "
            "registered as a dashboard resource. Falling back to injecting %s "
            "through the frontend instead",
            CARD_URL_BASE,
        )
        return None

    mode = data.resource_mode
    if mode != MODE_STORAGE:
        _LOGGER.info(
            "Lovelace resources are in '%s' mode, which is read-only, so the "
            "Zwitserleven Fondsen card is injected through the frontend as %s instead of "
            "being registered as a dashboard resource",
            mode,
            CARD_URL_BASE,
        )
        return None

    resources = data.resources
    if not hasattr(resources, "async_create_item"):
        _LOGGER.warning(
            "Lovelace reports '%s' resource mode but its resource collection "
            "(%s) is read-only, so the Zwitserleven Fondsen card is injected through the "
            "frontend as %s instead",
            mode,
            type(resources).__name__,
            CARD_URL_BASE,
        )
        return None
    return resources


def _register_extra_js(hass: HomeAssistant, url: str) -> None:
    """Fallback path: hand the URL to the frontend for injection."""
    try:
        add_extra_js_url(hass, url)
    except KeyError:
        _LOGGER.warning(
            "Frontend is not set up, so the card could not be registered "
            "automatically. Add %s as a dashboard resource of type 'module'.",
            CARD_URL_BASE,
        )


def _unregister_extra_js(hass: HomeAssistant, url: str) -> None:
    """Undo _register_extra_js. Mirrors its defensive, non-throwing handling."""
    try:
        remove_extra_js_url(hass, url)
    except (KeyError, ValueError):
        _LOGGER.debug(
            "Could not remove %s from the frontend extra JS urls; it may "
            "already be gone.",
            url,
        )


async def async_register_card(hass: HomeAssistant) -> None:
    """Serve the card file and make the frontend load it."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(f"/{DOMAIN}", str(_card_dir()), cache_headers=True)]
    )

    # Record the registration as soon as the static path exists. Callers guard
    # re-registration on this key and async_register_static_paths appends to
    # the aiohttp route table every time it is called, so the marker has to be
    # set even if one of the steps below raises.
    state = hass.data[DATA_FRONTEND] = {"url": CARD_URL_BASE, "resource_id": None}

    file_hash = await hass.async_add_executor_job(_file_hash)
    url = state["url"] = f"{CARD_URL_BASE}?v={file_hash}"

    resources = _writable_resources(hass)
    if resources is None:
        _register_extra_js(hass, url)
        return

    await resources.async_get_info()
    matches = [
        item
        for item in resources.async_items()
        if item.get("url", "").startswith(CARD_URL_BASE)
    ]
    for extra in matches[1:]:
        await resources.async_delete_item(extra["id"])

    if matches:
        item = matches[0]
        state["resource_id"] = item["id"]
        if item["url"] != url:
            await resources.async_update_item(
                item["id"], {"res_type": "module", "url": url}
            )
            _LOGGER.info(
                "Updated the Zwitserleven Fondsen dashboard resource %s to %s",
                item["id"],
                url,
            )
        else:
            _LOGGER.info(
                "Zwitserleven Fondsen is already registered as dashboard resource %s (%s)",
                item["id"],
                url,
            )
        return

    created = await resources.async_create_item({"res_type": "module", "url": url})
    state["resource_id"] = created["id"]
    _LOGGER.info(
        "Registered the Zwitserleven Fondsen card as dashboard resource %s (%s)",
        created["id"],
        url,
    )


async def async_unregister_card(hass: HomeAssistant) -> None:
    """Undo async_register_card. Safe to call when nothing was registered."""
    state = hass.data.pop(DATA_FRONTEND, None)
    if state is None:
        return

    resource_id = state["resource_id"]
    if resource_id is None:
        _unregister_extra_js(hass, state["url"])
        return

    resources = _writable_resources(hass)
    if resources is None:
        return
    try:
        await resources.async_delete_item(resource_id)
    except ItemNotFound:
        _LOGGER.debug(
            "Resource %s was already removed from the dashboard.", resource_id
        )
