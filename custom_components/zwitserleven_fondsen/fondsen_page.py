"""Fetch and parse the Zwitserleven fund overview page.

All funds are published on a single page. The coordinator and the config flow
share one FondsenPage, which keeps the parsed result for a short while so the
fund entries setting up together at startup cause a single download.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime

import aiohttp
from bs4 import BeautifulSoup
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.loader import async_get_integration

from .const import DATA_PAGE, DOMAIN, ZWITSERLEVEN_FONDSEN_URL

# Long enough to cover the fund entries setting up together at startup.
PAGE_CACHE_SECONDS = 60

_TIMEOUT = aiohttp.ClientTimeout(total=15)


class FondsenPageError(Exception):
    """The page could not be fetched or did not contain the fund table."""


@dataclass(frozen=True)
class FundQuote:
    symbol: str
    name: str
    price_date: str  # YYYY-MM-DD
    price: float


def parse_price(text: str) -> float:
    """Parse a Dutch formatted price like '€ 1.225,87' to 1225.87."""
    cleaned = (
        text.replace("€", "")
        .replace("\xa0", "")
        .replace(" ", "")
        .replace(".", "")
        .replace(",", ".")
    )
    try:
        return float(cleaned)
    except ValueError as err:
        raise ValueError(f"Could not parse price: {text!r}") from err


def parse_date(text: str) -> str:
    """Convert DD-MM-YYYY to YYYY-MM-DD."""
    try:
        return datetime.strptime(text.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")
    except ValueError as err:
        raise ValueError(f"Could not parse date: {text!r}") from err


def parse_funds(html: str) -> dict[str, FundQuote]:
    """Return every fund on the page, keyed by its button id (e.g. LTAAF).

    Rows that do not parse are skipped rather than failing the whole page, so
    one odd row cannot take down every fund.
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="fundoverview")
    if table is None:
        raise FondsenPageError("Could not find the fund table on the page")

    funds: dict[str, FundQuote] = {}
    for row in table.find_all("tr", class_="fundoverview__item"):
        button = row.find("button", class_="icon-favorite")
        name = row.find("td", class_="fundoverview__fund")
        date = row.find("td", class_="fundoverview__date")
        rate = row.find("td", class_="fundoverview__rate")
        if not (button and button.get("id") and name and date and rate):
            continue
        try:
            quote = FundQuote(
                symbol=button["id"].strip().upper(),
                name=name.get_text(strip=True),
                price_date=parse_date(date.get_text(strip=True)),
                price=parse_price(rate.get_text(strip=True)),
            )
        except ValueError:
            continue
        funds[quote.symbol] = quote
    return funds


class FondsenPage:
    """The fund overview page, shared by all config entries."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._lock = asyncio.Lock()
        self._funds: dict[str, FundQuote] | None = None
        self._fetched_at = 0.0
        self._user_agent: str | None = None

    async def async_get_funds(self) -> dict[str, FundQuote]:
        async with self._lock:
            if (
                self._funds is not None
                and time.monotonic() - self._fetched_at < PAGE_CACHE_SECONDS
            ):
                return self._funds
            html = await self._async_fetch()
            # BeautifulSoup parses synchronously; keep it off the event loop.
            self._funds = await self._hass.async_add_executor_job(parse_funds, html)
            self._fetched_at = time.monotonic()
            return self._funds

    async def _async_user_agent(self) -> str:
        """Name this integration, so Zwitserleven can see who fetches the page."""
        if self._user_agent is None:
            integration = await async_get_integration(self._hass, DOMAIN)
            self._user_agent = (
                f"ZwitserlevenFondsen/{integration.version} "
                f"(+{integration.documentation}) HomeAssistant/{HA_VERSION}"
            )
        return self._user_agent

    async def _async_fetch(self) -> str:
        session = async_get_clientsession(self._hass)
        headers = {"User-Agent": await self._async_user_agent()}
        try:
            async with session.get(
                ZWITSERLEVEN_FONDSEN_URL, headers=headers, timeout=_TIMEOUT
            ) as resp:
                if resp.status != 200:
                    raise FondsenPageError(f"Zwitserleven returned HTTP {resp.status}")
                return await resp.text()
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise FondsenPageError(f"Network error fetching the fund page: {err}") from err


def get_page(hass: HomeAssistant) -> FondsenPage:
    """Return the FondsenPage shared by all config entries, creating it once."""
    page = hass.data.get(DATA_PAGE)
    if page is None:
        page = hass.data[DATA_PAGE] = FondsenPage(hass)
    return page
