# UA/EN and neighboring oblast references

The top bar has separate UA and EN buttons. The selected language is stored locally. HUD labels, alerts, legend, visualization controls, notices and popup labels update without a page reload. Public source reports and source geographic names remain unchanged.

## Boundary references

The frontend loads `kharkiv-neighbor-oblasts.geojson`, extracted without coordinate simplification from the user-supplied `UA_FULL_Ukraine.geojson`.

| Backend ID | Region | GeoJSON ISO code |
|---|---|---|
| `sumy_oblast` | Сумська область / Sumy Oblast | UA-59 |
| `poltava_oblast` | Полтавська область / Poltava Oblast | UA-53 |
| `dnipropetrovsk_oblast` | Дніпропетровська область / Dnipropetrovsk Oblast | UA-12 |
| `donetsk_oblast` | Донецька область / Donetsk Oblast | UA-14 |
| `luhansk_oblast` | Луганська область / Luhansk Oblast | UA-09 |

An explicit direction target or departure report naming one of these regions is projected to the nearest point on its exterior boundary. The calculation uses the same local latitude-adjusted segment projection as the existing ring-road feature. Polygon and MultiPolygon geometries are supported; internal holes are excluded.

The origin is the latest unambiguous resolved place in the event's actual reply ancestry, within the same track segment. Unresolved intervening replies can be followed backward. Separate chronological messages, missing ancestors, cycles, alternative origins/destinations, and multi-object reports do not produce a guessed border point. Source-derived midpoints and centroids do not override ambiguous source places.

Bare `Сумська`, `вул. Сумська`, and `Суми` do not qualify. Both the region ID and explicit oblast wording or regional nickname are required. Ordinary reports of presence somewhere in an oblast do not create a boundary reference.

The projected point has provenance fields `region_border_*`; its popup explains that the reference is approximate and does not confirm an actual crossing. The edge to its ancestral origin is straight. Existing ordinary track curves and ring-road behavior are retained.

Departures remain inactive. With track display mode ALL, their final segment stays visible as history for 30 minutes after the departure report. Historical debug branches remain available through the existing `airDebugTrack` query parameter.

## Backend prerequisite

The separate server bundle adds explicit region-departure parsing through a small decorator, adds oblast declensions and the Luhansk oblast record, and retains `geometry_resolved=false` with no fabricated region center. Install that bundle on `/opt/tlk-map` and restart the processor/API before verifying departures on production. This repository contains only the frontend portion.

## Aviation

`air-region-alerts.js` loads the separate read-only `/api/monitor/region-alerts` feed. Its markers are fixed regional references for civilian public notices, with an aviation symbol and two red pulsing neon rings. They have no flight paths, aircraft counts or object positions and do not contribute to the target HUD. Activity reports and reported takeoffs are labeled separately. The panel above the bottom-left alarm indicator lists current report regions; selecting a region opens its reference and explanation. The map does not automatically change its view when a notice arrives. The legend retains its visibility and collapsed state when switching languages.

| Region | User-provided approximate reference (lat, lng) |
|---|---|
| Nizhny Novgorod | 55.991434, 44.415355 |
| Murmansk | 68.480743, 33.600495 |
| Saratov | 51.788829, 46.573604 |
| Belgorod | 50.643981, 36.589746 |

The backend requires an explicit region in the relevant report clause (or BNR for Belgorod). It performs no airfield lookup or origin inference. Negated, closed, multi-region and transit/launch-area reports do not activate references. Closing a reply chain removes notices in that chain; a newer independent notice is preserved. Reports expire after 30 minutes from their original timestamp; edits do not make old reports current. A disappeared marker is not an official all clear.

The frontend polls independently every 30 seconds, removes expired references even between polls, and distinguishes no recent reports from an unavailable feed. Failed requests remove the regional references. Data from this feed cannot change reference coordinates. Both the panel and popups translate to UA/EN; reduced-motion settings stop the pulse animation. The layer is disabled in DEMO and stops when leaving AIR mode.

## Validation

Run `npm ci && npm test`.

- 26 boundary checks: all five regions, segment projection, MultiPolygon, invalid/missing data, Cyrillic street/city distinction, reply ancestry, ambiguity and cycles.
- DOM integration with actual Leaflet: language switching, stored selection, controls, notice, alert state, unchanged source reports, threat class, approximate border popup, straight closing edge, inactive count, four regional notices, translated regional popup, coordinate-injection rejection, expired/future reports, feed failures and teardown.
- 27 separate backend notice checks, including unchanged SQLite bytes and actual examples from the user-provided audit.
- The separate backend suite passes 90 region cases and the 253, 68, 20 and 14 existing city/ring checks. An isolated processor/SQLite/API integration verifies 13 messages covering the five regions and a Sumy street counterexample.

DOM tests do not verify pixel layout. The local graphical browser could not start in the execution environment. Desktop and mobile appearance still require a browser review before publishing.
