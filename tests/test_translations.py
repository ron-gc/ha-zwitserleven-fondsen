"""Every translation must have the same keys and placeholders as strings.json."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

INTEGRATION = Path(__file__).parent.parent / "custom_components" / "zwitserleven_fondsen"
TRANSLATIONS = sorted((INTEGRATION / "translations").glob("*.json"))


def _flatten(tree: dict[str, Any], prefix: str = "") -> dict[str, str]:
    flat: dict[str, str] = {}
    for key, value in tree.items():
        path = f"{prefix}{key}"
        if isinstance(value, dict):
            flat.update(_flatten(value, f"{path}."))
        else:
            flat[path] = value
    return flat


def _load(path: Path) -> dict[str, str]:
    return _flatten(json.loads(path.read_text(encoding="utf-8")))


def _placeholders(text: str) -> set[str]:
    return set(re.findall(r"\{(\w+)\}", text))


SOURCE = _load(INTEGRATION / "strings.json")


def test_dutch_is_included() -> None:
    assert "nl.json" in [path.name for path in TRANSLATIONS]


@pytest.mark.parametrize("path", TRANSLATIONS, ids=lambda path: path.name)
def test_translation_matches_strings(path: Path) -> None:
    translation = _load(path)
    assert translation.keys() == SOURCE.keys()
    for key, text in SOURCE.items():
        assert _placeholders(translation[key]) == _placeholders(text), key


def test_english_is_strings_json() -> None:
    assert _load(INTEGRATION / "translations" / "en.json") == SOURCE
