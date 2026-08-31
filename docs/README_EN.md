# AIR Threat Map — Detailed Technical Documentation

[← Back to main README](../README.md) | [Українська технічна документація](README_UA.md)

## 1. Purpose

**AIR Threat Map** is a standalone web interface for visualizing source-reported air-threat information from the public Telegram source `monitor1654`, after server-side processing.

The system transforms textual reports into structured events, geographic references, Telegram reply branches, and cartographic tracks. It also displays the current air-raid alert status for **Kharkiv city and the Kharkiv territorial community** through a server-side proxy to the Ukraine Alarm API.

This repository contains the standalone frontend. The collector, parser/processor, SQLite database, and FastAPI backend run separately on an Oracle Cloud VM.

## 2. Critical disclaimer

AIR Threat Map is not a radar system and does not receive military telemetry. It does not know verified real-time coordinates of airborne objects and does not predict physical trajectories.

- a marker does not mean a verified actual object position;
- a track line represents a sequence of source-reported geographic references within an explicit Telegram reply chain;
- `direction_target` is not a confirmed current position;
- midpoint/centroid is a derived cartographic reference;
- a terminal marker does not represent a verified exact impact/interception coordinate unless the source explicitly reported one;
- data may be delayed, incomplete, or inaccurate;
- the map must not be used for mission planning, route planning, determining safe areas, or other safety-critical decisions.

During an air alert, follow official civil-protection instructions and official alert channels.

## 3. Public URLs

GitHub Pages:

```text
https://deafinicio.github.io/air-threat-map/
```

Repository:

```text
https://github.com/deafinicio/air-threat-map
```

## 4. High-level architecture

```text
Public Telegram source: monitor1654
              │
              ▼
      monitor_collector.py
              │
              ▼
      monitor_messages.db
              │
              ▼
      monitor_processor.py
              │
              ├── monitor_parsed_events
              ├── monitor_branch_events
              ├── monitor_branches
              └── monitor_branch_tracks
              │
              ▼
            FastAPI
              │
              ▼
            Uvicorn
        127.0.0.1:8000
              │
              ▼
             Caddy
          HTTPS reverse proxy
              │
              ├── /api/monitor/tracks
              ├── /api/monitor/debug-track/...
              └── /api/alarm/kharkiv
              │
              ▼
          GitHub Pages
              │
              ▼
          index.html
          air-mode.js
              │
              ▼
             Leaflet
```

## 5. Frontend repository structure

```text
air-threat-map/
├── index.html
├── air-mode.js
├── kharkiv-ring-road.geojson
├── README.md
└── docs/
    ├── README_UA.md
    └── README_EN.md
```

### `index.html`

Responsible for the standalone layout, Leaflet initialization, HUD, local clock/date, basemap selector, coordinate rulers, LAT/LON cursor readout, lock-on reticle, AIR Visual Params styling, the Kharkiv alert indicator, and polling `/api/alarm/kharkiv`.

### `air-mode.js`

The main AIR engine. It contains API polling, backend payload normalization, threat rendering, semantic place handling, midpoint/centroid logic, reply-linked tracks, active/stale filtering, aggregate snapshot handling, terminal marker anchoring, ALL/SEL/OFF modes, visual settings, legend, disclaimer, ring-road linear-reference projection, and historical debug support.

### `kharkiv-ring-road.geojson`

GeoJSON geometry of the Kharkiv ring road, used as a linear cartographic reference when the source explicitly mentions the ring road.

## 6. Standalone mode

`index.html` sets:

```html
<html lang="uk" data-air-standalone="true">
```

`air-mode.js` reads this through `AIR_STANDALONE`. In standalone mode, AIR starts automatically, the MINE UI is not used, and the MINE/AIR toggle is not installed.

The standalone repository duplicates AIR functionality without removing it from the original `mine-risk-map` project.

## 7. Backend runtime

Current backend stack:

```text
Ubuntu 24.04
Python 3.12
FastAPI
Uvicorn
SQLite
Caddy
systemd
```

Main working directory:

```text
/opt/tlk-map
```

Uvicorn listens on:

```text
127.0.0.1:8000
```

External HTTPS access is provided by Caddy.

## 8. Systemd services

Main services:

```text
tlk-api.service
monitor-collector.service
monitor-processor.service
```

`tlk-api.service` runs:

```text
/opt/tlk-map/.venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
```

`monitor-collector.service` receives and stores raw Telegram messages.

`monitor-processor.service` parses raw data and rebuilds derived tables, reply branches, and branch tracks.

A legacy `tlk-collector.service` may also remain on the server; it is not the primary ingestion layer for the standalone AIR frontend.

## 9. Collector layer

File:

```text
/opt/tlk-map/monitor_collector.py
```

The collector should preserve raw source messages without predicting geometry. Critical fields include `message_id`, `reply_to_message_id`, Telegram timestamp, original text, and supporting metadata.

## 10. Processor layer

File:

```text
/opt/tlk-map/monitor_processor.py
```

The processor:

1. reads raw Telegram messages;
2. invokes the parser;
3. normalizes threat/status/relation/place semantics;
4. builds reply branches;
5. builds branch tracks;
6. writes derived tables.

Rebuilds use `_next` tables and atomic swaps. Do not run a manual `--once` concurrently with an active `monitor-processor.service`.

Safe manual rebuild:

```bash
sudo systemctl stop monitor-processor.service
./.venv/bin/python3 monitor_processor.py --once
sudo systemctl start monitor-processor.service
```

## 11. SQLite

Main database:

```text
/opt/tlk-map/monitor_messages.db
```

Key tables:

```text
messages
monitor_parsed_events
monitor_branch_events
monitor_branches
monitor_branch_tracks
```

`messages` stores raw Telegram data.

`monitor_parsed_events` stores semantic parser output: message/reply IDs, timestamps, threat class, object count, relation, status, places, geometry flags, and original text.

`monitor_branch_events` links events to reply branches.

`monitor_branches` represents the logical Telegram reply-tree structure.

`monitor_branch_tracks` stores the aggregated branch state. A branch ID conceptually has the form:

```text
root_message_id:leaf_message_id
```

Therefore, the branch ID may change when a new reply extends the branch.

## 12. Threat taxonomy

Supported classes include:

```text
shahed
shahed_reactive
reactive_uav
attack_uav
recon_uav
uav_unknown
fpv
molniya
banderol
kab
ballistic
missile
aviation
```

Threat class determines marker shape/color and legend mapping.

## 13. Status semantics

Source statuses include, among others:

```text
observed_again
intercepted
fallen
left_region
lost_tracking
threat_persists
clear
```

The frontend also uses normalized terminal representations such as:

```text
lost_tracking
fallen_reported
intercepted_reported
```

A status reflects what the source reported, not independently verified telemetry.

## 14. Geographic roles

Main `location_role` values:

```text
reported_position
reported_area
direction_target
inherited_direction
warning_area
launch_target
source_origin
linear_reference_projection
```

Trackable source roles in the frontend include `reported_position`, `reported_area`, `direction_target`, `inherited_direction`, and `linear_reference_projection`.

`direction_target` remains a direction/reference and must not be interpreted as a confirmed current position.

## 15. Place resolver

Typical backend files:

```text
monitor_places.json
monitor_place_resolver.py
```

The resolver handles grammatical-form normalization, aliases, canonical names, coordinate assignment, ambiguity detection, and geometry resolution.

Duplicate aliases should be avoided because they may produce ambiguous resolution.

## 16. Reply-linked tracks

A track is created only through an explicit Telegram reply relationship.

```text
Message A
   ↓ reply
Message B
   ↓ reply
Message C
```

may produce `A → B → C`.

Messages are not connected merely because they have the same threat class, are close in time, or refer to nearby geography.

A line on the map is a visualization of a source-linked geographic sequence, not an exact physical trajectory.

## 17. Midpoint / centroid

For a single-object report with two resolved places, the frontend may create a midpoint between those source references. For three or more resolved references, it may use a centroid.

The derived anchor retains metadata about the original source places and is explicitly treated as an approximate cartographic reference.

For multi-object reports (`object_count > 1`), midpoint/centroid collapsing is not applied.

## 18. Multi-object reports

Example:

```text
Currently 3 UAVs ...
2 toward Barvinkove
1 toward Lozova
```

Expected live representation:

```text
Barvinkove -> group count 2
Lozova     -> group count 1
```

For a specific group, `segment_object_count` takes precedence over the total event count.

## 19. Aggregate snapshots

Messages of the form:

```text
Наразі N ...
```

are treated as current-situation snapshots. A newer snapshot of the same threat class supersedes the older one in LIVE rendering, while historical records remain in the database.

## 20. Terminal marker anchoring

If a terminal message contains its own resolved geographic point, the marker uses that point.

If a terminal message such as `Впала в області`, `Збито`, or `Більше не відстежується` contains no resolved place, the frontend walks backward through the explicit reply branch and uses the latest resolved source reference as a visual anchor.

This does not mean the system has determined the true terminal-event coordinate.

## 21. Kharkiv ring road

`kharkiv-ring-road.geojson` contains the ring-road geometry. For unresolved references that explicitly mention the ring road, the frontend may generate an approximate `linear_reference_projection` onto that geometry.

This is a cartographic anchor, not an exact object position.

## 22. LIVE freshness

Frontend operational TTL:

```text
30 minutes
```

A track is considered LIVE only if the backend considers it active and the latest meaningful observation is sufficiently fresh.

This prevents indefinitely displaying an old active branch when no terminal status was published.

## 23. API polling

Main endpoint:

```text
GET /api/monitor/tracks
```

Frontend refresh interval:

```text
5 seconds
```

Typical parameters include `lookback_hours`, `limit`, `active_only`, and `geometry_only`.

## 24. Historical debug mode

Frontend URL parameter:

```text
?airDebugTrack=ROOT:LEAF
```

Backend endpoint:

```text
/api/monitor/debug-track/{root_message_id}/{leaf_message_id}
```

A debug track allows rendering a historical explicit reply branch independently of LIVE TTL and must not become an active operational track.

## 25. Track display modes

Supported modes:

```text
ALL
SEL
OFF
```

- `ALL` — history/curves for all visible tracks;
- `SEL` — detailed history only for the selected track;
- `OFF` — history/curves disabled.

The mode is sticky: clicking a marker does not change the display mode by itself.

## 26. LIVE / DEMO

The AIR engine has a data-mode toggle:

```text
LIVE
DEMO
```

LIVE reads the backend API. DEMO may use a local `demo-air.json` if that file is present.

## 27. Visual settings

The `VIS` panel allows adjustment of:

- icon glow;
- glow radius;
- pulse;
- track glow;
- track width;
- Kharkiv ring-road intensity.

Settings are stored in browser `localStorage`.

## 28. Basemaps

The standalone frontend uses a Leaflet basemap selector.

Current options:

```text
Dark Ops — Esri
Esri Topographic
OpenStreetMap
```

CARTO tiles were removed after they started displaying an `API KEY REQUIRED` watermark.

## 29. HUD and disclaimer

The HUD displays local time, date, tracks loaded, active tracks, mapped positions, and AIR feed status.

A disclaimer is displayed when entering AIR and explains that the system is not a radar/telemetry/prediction tool.

## 30. Kharkiv alert indicator

The standalone frontend contains a separate HUD indicator:

```text
KHARKIV CITY / COMMUNITY
```

States:

```text
CLEAR
AIR ALERT
NO DATA
```

Frontend polling interval:

```text
15 seconds
```

Endpoint:

```text
GET /api/alarm/kharkiv
```

Current region ID:

```text
1293
```

The API identifies it as `Kharkiv and Kharkivska community` / `м. Харків та Харківська територіальна громада`.

## 31. Ukraine Alarm API proxy

The browser does not call the Ukraine Alarm API directly. The FastAPI backend performs a server-side request to:

```text
https://api.ukrainealarm.com/api/v3/alerts/1293
```

The token is stored only on the server in:

```text
/etc/tlk-map-api.env
```

with:

```text
UKRAINE_ALARM_TOKEN=<secret>
```

A systemd override loads this file via `EnvironmentFile`.

`/api/alarm/kharkiv` returns a simplified payload such as:

```json
{
  "ok": true,
  "region": "м. Харків та Харківська територіальна громада",
  "region_id": "1293",
  "status": "AIR_ALERT",
  "air_alert": true,
  "active_alert_types": ["AIR"],
  "source": "Ukraine Alarm API"
}
```

The token must never be placed in `index.html`, `air-mode.js`, or the public repository.

## 32. CORS

FastAPI allows the GitHub Pages origin:

```text
https://deafinicio.github.io
```

For local development it may also allow:

```text
http://127.0.0.1:8080
http://localhost:8080
```

## 33. Local development

On Windows:

```powershell
cd C:\air-threat-map
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

Testing through `file:///...` is not recommended because browser security and local fetch behavior differ.

## 34. GitHub Pages deployment

Repository:

```text
deafinicio/air-threat-map
```

Pages settings:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Public URL:

```text
https://deafinicio.github.io/air-threat-map/
```

## 35. DNS / sslip.io

The API currently uses an `sslip.io`-based hostname. If the browser reports `ERR_NAME_NOT_RESOLVED`, the local DNS resolver may be the cause.

Known public DNS resolver options include:

```text
Cloudflare: 1.1.1.1 / 1.0.0.1
Google:     8.8.8.8 / 8.8.4.4
```

Long term, a dedicated stable API hostname is preferable.

## 36. Troubleshooting

Services:

```bash
systemctl is-active monitor-collector.service
systemctl is-active monitor-processor.service
systemctl is-active tlk-api.service
systemctl is-active caddy
```

Local API:

```bash
curl http://127.0.0.1:8000/api/monitor/tracks
curl http://127.0.0.1:8000/api/alarm/kharkiv
```

Public API:

```bash
curl https://89-168-114-2.sslip.io/api/monitor/tracks
curl https://89-168-114-2.sslip.io/api/alarm/kharkiv
```

Browser diagnostics:

```text
F12 → Console
F12 → Network
```

## 37. Development rules

Before committing frontend changes:

```powershell
node --check .\air-mode.js
git diff --check
```

Stage specific files:

```bash
git add air-mode.js index.html kharkiv-ring-road.geojson README.md docs/README_UA.md docs/README_EN.md
```

Avoid `git add .` because local backup files should not enter the repository.

## 38. Core semantic rules

1. Do not predict a physical trajectory.
2. Do not create an inferred impact point.
3. Do not interpret a direction target as a confirmed current position.
4. Do not connect unrelated messages without an explicit reply.
5. Derived midpoint/centroid must remain an approximate visual reference.
6. Aggregate snapshots must not accumulate as independent simultaneous live groups.
7. A terminal marker without its own geometry may use the branch's latest source reference only as a visual anchor.
8. Raw source text should remain available for auditing/debugging.
9. Public frontend code must not contain API secrets.

## 39. Current technical debt / future refactoring

Standalone `air-mode.js` historically originated from the combined `mine-risk-map`, so it still contains compatibility code and legacy naming, including `mine-risk-map-*` localStorage keys and MINE placeholders.

Possible future refactoring:

- extract the shared AIR engine into a reusable module;
- move CSS out of `index.html`;
- move API host configuration into a dedicated configuration layer;
- replace `sslip.io` with a dedicated domain;
- add automated tests for parser/normalizer/snapshot semantics;
- define a versioned API contract;
- automate deployment and health checks.

---

**AIR Threat Map** remains an informational visualization of source-reported data. It does not replace official alert systems and must not be treated as verified tactical telemetry.
