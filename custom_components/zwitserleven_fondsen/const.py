from datetime import timedelta

DOMAIN = "zwitserleven_fondsen"

CONF_SYMBOL = "symbol"
CONF_NAME = "name"

# Zwitserleven publishes at most one price per day, so the page is fetched at
# startup and once every night. Each installation gets its own time in the
# update window, so they don't all request the page at once. A failed fetch is
# retried every RETRY_INTERVAL.
UPDATE_WINDOW_START_HOUR_UTC = 20
UPDATE_WINDOW = timedelta(hours=10)  # 20:00 - 06:00 UTC
RETRY_INTERVAL = timedelta(hours=1)

PRICE_DECIMALS = 4

# The fund page shared by the coordinator and the config flow, see fondsen_page.
DATA_PAGE = f"{DOMAIN}_page"
# The coordinator shared by every config entry, see coordinator.
DATA_COORDINATOR = f"{DOMAIN}_coordinator"

ZWITSERLEVEN_FONDSEN_URL = (
    "https://www.zwitserleven.nl/over-zwitserleven/verantwoord-beleggen/fondsen/"
)
