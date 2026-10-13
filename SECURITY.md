# Security policy

## Supported versions

Only the latest release receives security fixes. Please update before
reporting a problem.

## Reporting a vulnerability

Please do not report security problems in a public issue.

Report them privately through GitHub instead:
[Report a vulnerability](https://github.com/ron-gc/ha-zwitserleven-fondsen/security/advisories/new).

Please include:

- the version of this integration and of Home Assistant,
- what the problem is and what an attacker could do with it,
- the steps to reproduce it.

## What to expect

This integration is maintained in spare time. You can expect a first
response within two weeks. Once a problem is confirmed, it is fixed in a
new release, and a security advisory is published once that release is out.
You are credited in the advisory unless you prefer not to be.

## Scope

In scope:

- the integration in `custom_components/zwitserleven_fondsen`, including the
  history API at `/api/zwitserleven_fondsen/history`,
- the dashboard card.

Out of scope:

- Home Assistant itself: report those to the
  [Home Assistant project](https://www.home-assistant.io/security/),
- the Zwitserleven website: this integration only reads its public fund page
  and is not affiliated with Zwitserleven.
