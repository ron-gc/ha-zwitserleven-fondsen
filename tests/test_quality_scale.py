"""Checks on quality_scale.yaml, which hassfest only validates for core integrations."""
import json
from pathlib import Path

import yaml

INTEGRATION = Path(__file__).parent.parent / "custom_components" / "zwitserleven_fondsen"


def _rules():
    return yaml.safe_load((INTEGRATION / "quality_scale.yaml").read_text(encoding="utf-8"))[
        "rules"
    ]


def test_the_manifest_claims_platinum():
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["quality_scale"] == "platinum"


def test_every_rule_is_done_or_exempt():
    """Platinum needs every rule of every tier."""
    for rule, value in _rules().items():
        status = value if isinstance(value, str) else value["status"]
        assert status in ("done", "exempt"), rule


def test_every_exemption_is_explained():
    for rule, value in _rules().items():
        if isinstance(value, dict) and value["status"] == "exempt":
            assert value.get("comment"), rule
