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

`air-aviation-symbol.js` provides an aircraft SVG and two red pulsing neon rings, plus a count badge and reduced-motion support. Loading the component does not display an aviation marker. Activating the aviation feed requires reviewed raw takeoff reports, user-supplied regional reference coordinates, and source-based activation/closure rules. Activity reports alone are not treated as confirmed takeoffs.

## Validation

Run `npm ci && npm test`.

- 26 boundary checks: all five regions, segment projection, MultiPolygon, invalid/missing data, Cyrillic street/city distinction, reply ancestry, ambiguity and cycles.
- DOM integration with actual Leaflet: language switching, stored selection, controls, notice, alert state, unchanged source reports, threat class, approximate border popup, straight closing edge, inactive count and aviation symbol.
- The separate backend suite passes 90 region cases and the 253, 68, 20 and 14 existing city/ring checks. An isolated processor/SQLite/API integration verifies 13 messages covering the five regions and a Sumy street counterexample.

DOM tests do not verify pixel layout. The local graphical browser could not start in the execution environment. Desktop and mobile appearance still require a browser review before publishing.
