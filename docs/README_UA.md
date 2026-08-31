# AIR Threat Map — детальна технічна документація

[← Повернутися до головного README](../README.md) | [English technical documentation](README_EN.md)

## 1. Призначення

**AIR Threat Map** — standalone вебінтерфейс для візуалізації повідомлень про повітряні загрози, отриманих із відкритого Telegram-джерела `monitor1654` та попередньо оброблених серверною частиною системи.

Система перетворює текстові повідомлення у структуровані події, географічні орієнтири, reply-гілки та картографічні треки. Окремо відображається статус повітряної тривоги для **м. Харків та Харківської територіальної громади** через server-side proxy до Ukraine Alarm API.

Цей репозиторій містить standalone frontend. Collector, parser/processor, SQLite database та FastAPI API працюють окремо на Oracle Cloud VM.

## 2. Критичне застереження

AIR Threat Map не є радаром і не отримує військову телеметрію. Карта не знає підтверджених реальних координат повітряних об'єктів та не прогнозує фізичні траєкторії.

- marker не означає підтверджену фактичну позицію;
- track line відображає послідовність source-reported geographic references у межах explicit Telegram reply chain;
- `direction_target` не є підтвердженою поточною позицією;
- midpoint/centroid є derived cartographic reference;
- terminal marker не означає точну координату падіння або перехоплення, якщо джерело її не повідомило;
- система може відображати дані із затримкою, а джерело може бути неповним або неточним;
- карта не призначена для mission planning, route planning, визначення безпечних зон або інших safety-critical рішень.

Під час повітряної тривоги необхідно керуватися офіційними повідомленнями та правилами цивільного захисту.

## 3. Публічні адреси

GitHub Pages:

```text
https://deafinicio.github.io/air-threat-map/
```

Repository:

```text
https://github.com/deafinicio/air-threat-map
```

## 4. Високорівнева архітектура

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

## 5. Структура frontend repository

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

Відповідає за standalone layout, Leaflet initialization, HUD, local clock/date, basemap selector, coordinate rulers, cursor LAT/LON readout, lock-on reticle, AIR Visual Params styling, Kharkiv alert indicator та polling `/api/alarm/kharkiv`.

### `air-mode.js`

Основний AIR engine. Містить API polling, normalization backend payload, threat rendering, semantic place handling, midpoint/centroid logic, reply-linked tracks, active/stale filtering, aggregate snapshot handling, terminal marker anchoring, ALL/SEL/OFF modes, visual settings, legend, disclaimer, ring-road linear reference projection та historical debug support.

### `kharkiv-ring-road.geojson`

GeoJSON-геометрія Харківської кільцевої дороги. Використовується як linear cartographic reference для повідомлень, які явно згадують кільцеву.

## 6. Standalone mode

`index.html` задає:

```html
<html lang="uk" data-air-standalone="true">
```

`air-mode.js` читає цей прапорець через `AIR_STANDALONE`. У standalone-режимі AIR запускається автоматично, MINE UI не використовується, а кнопка перемикання MINE/AIR не створюється.

Standalone repository дублює AIR-функціонал, не видаляючи його з початкового `mine-risk-map`.

## 7. Backend runtime

Поточний backend stack:

```text
Ubuntu 24.04
Python 3.12
FastAPI
Uvicorn
SQLite
Caddy
systemd
```

Основний каталог:

```text
/opt/tlk-map
```

Uvicorn:

```text
127.0.0.1:8000
```

Зовнішній HTTPS доступ забезпечує Caddy.

## 8. Systemd services

Основні служби:

```text
tlk-api.service
monitor-collector.service
monitor-processor.service
```

`tlk-api.service` запускає:

```text
/opt/tlk-map/.venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
```

`monitor-collector.service` отримує та зберігає raw Telegram messages.

`monitor-processor.service` парсить raw data та перебудовує derived tables / reply branches / branch tracks.

На сервері також може залишатися legacy `tlk-collector.service`, який не є основним ingestion layer для standalone AIR.

## 9. Collector layer

Файл:

```text
/opt/tlk-map/monitor_collector.py
```

Collector повинен зберігати raw повідомлення без прогнозування геометрії. Критичні поля включають `message_id`, `reply_to_message_id`, Telegram timestamp, original text та службові metadata.

## 10. Processor layer

Файл:

```text
/opt/tlk-map/monitor_processor.py
```

Processor:

1. читає raw Telegram messages;
2. викликає parser;
3. нормалізує threat/status/relation/place semantics;
4. будує reply branches;
5. формує branch tracks;
6. записує derived tables.

Rebuild використовує `_next` tables та atomic swap. Не слід запускати ручний `--once` одночасно з активним `monitor-processor.service`.

Безпечний manual rebuild:

```bash
sudo systemctl stop monitor-processor.service
./.venv/bin/python3 monitor_processor.py --once
sudo systemctl start monitor-processor.service
```

## 11. SQLite

Основна база:

```text
/opt/tlk-map/monitor_messages.db
```

Ключові таблиці:

```text
messages
monitor_parsed_events
monitor_branch_events
monitor_branches
monitor_branch_tracks
```

`messages` містить raw Telegram data.

`monitor_parsed_events` містить semantic representation після parser-а: message/reply IDs, timestamps, threat class, object count, relation, status, places, geometry flags та original text.

`monitor_branch_events` зв'язує events із reply branches.

`monitor_branches` описує логічну Telegram reply-tree структуру.

`monitor_branch_tracks` містить агрегований стан branch. Branch ID концептуально має форму:

```text
root_message_id:leaf_message_id
```

Тому ID може змінитися після появи нового reply.

## 12. Threat taxonomy

Підтримуються, зокрема:

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

Тип загрози визначає форму/колір marker-а та legend entry.

## 13. Status semantics

Source statuses включають, зокрема:

```text
observed_again
intercepted
fallen
left_region
lost_tracking
threat_persists
clear
```

Frontend також використовує normalized terminal states, наприклад:

```text
lost_tracking
fallen_reported
intercepted_reported
```

Статус відображає повідомлення джерела, а не independently verified telemetry.

## 14. Geographic roles

Основні `location_role`:

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

Trackable source roles у frontend включають `reported_position`, `reported_area`, `direction_target`, `inherited_direction` та `linear_reference_projection`.

`direction_target` залишається напрямком/орієнтиром та не повинен інтерпретуватися як confirmed current position.

## 15. Place resolver

Типові backend files:

```text
monitor_places.json
monitor_place_resolver.py
```

Resolver виконує normalization grammatical forms, aliases, canonical names, coordinate assignment, ambiguity detection та geometry resolution.

Duplicate aliases потрібно уникати, оскільки вони можуть створювати ambiguity.

## 16. Reply-linked tracks

Трек формується лише через explicit Telegram reply relationship.

```text
Message A
   ↓ reply
Message B
   ↓ reply
Message C
```

може утворити `A → B → C`.

Повідомлення не з'єднуються лише через однаковий threat type, часову близькість чи географічну близькість.

Лінія на карті — це візуалізація source-linked geographic sequence, а не точна фізична траєкторія.

## 17. Midpoint / centroid

Для single-object report з двома resolved places frontend може створити midpoint між source references. Для трьох і більше resolved references може використовувати centroid.

Derived anchor зберігає metadata про оригінальні source places та явно позначається як приблизний cartographic reference.

Для multi-object report (`object_count > 1`) collapsing не застосовується.

## 18. Multi-object reports

Приклад:

```text
Наразі 3 БПЛА ...
2 на Барвінкове
1 на Лозову
```

Очікуване live representation:

```text
Барвінкове -> group count 2
Лозова     -> group count 1
```

Для конкретної групи `segment_object_count` має пріоритет над загальним event count.

## 19. Aggregate snapshots

Повідомлення виду:

```text
Наразі N ...
```

трактуються як current situation snapshots. Новіший snapshot тієї самої threat class supersede-ить старіший у LIVE-візуалізації, але історичні записи залишаються в database.

## 20. Terminal marker anchoring

Якщо terminal message містить власну resolved географічну точку, marker використовує її.

Якщо terminal message на кшталт `Впала в області`, `Збито` або `Більше не відстежується` не містить resolved place, frontend проходить explicit reply branch назад та використовує останній resolved source reference.

Це не означає, що система встановила фактичну координату terminal event.

## 21. Харківська кільцева дорога

`kharkiv-ring-road.geojson` містить геометрію кільцевої. Для unresolved references, де джерело явно згадує кільцеву, frontend може створювати approximate `linear_reference_projection` на geometry road.

Це cartographic anchor, а не точна координата об'єкта.

## 22. LIVE freshness

Frontend operational TTL:

```text
30 minutes
```

Track вважається LIVE, якщо backend позначає його active і остання meaningful observation достатньо свіжа.

Це захищає від безстрокового відображення старого active branch, якщо джерело не дало terminal status.

## 23. API polling

Основний endpoint:

```text
GET /api/monitor/tracks
```

Frontend refresh interval:

```text
5 seconds
```

Типові параметри включають `lookback_hours`, `limit`, `active_only`, `geometry_only`.

## 24. Historical debug mode

Frontend підтримує URL parameter:

```text
?airDebugTrack=ROOT:LEAF
```

Backend endpoint:

```text
/api/monitor/debug-track/{root_message_id}/{leaf_message_id}
```

Debug track дозволяє відобразити historical explicit reply branch незалежно від LIVE TTL і не повинен ставати active operational track.

## 25. Track display modes

Підтримуються:

```text
ALL
SEL
OFF
```

- `ALL` — history/curves для всіх видимих tracks;
- `SEL` — detailed history лише обраного track;
- `OFF` — history/curves вимкнені.

Режим sticky: клік по marker не змінює режим самостійно.

## 26. LIVE / DEMO

AIR engine має data mode toggle:

```text
LIVE
DEMO
```

LIVE читає backend API. DEMO може використовувати локальний `demo-air.json`, якщо файл присутній.

## 27. Visual settings

Панель `VIS` дозволяє змінювати:

- icon glow;
- glow radius;
- pulse;
- track glow;
- track width;
- Kharkiv ring-road intensity.

Settings зберігаються в browser `localStorage`.

## 28. Basemaps

Standalone frontend використовує Leaflet basemap selector.

Поточні варіанти:

```text
Dark Ops — Esri
Esri Topographic
OpenStreetMap
```

CARTO tiles були прибрані після появи `API KEY REQUIRED` watermark.

## 29. HUD та disclaimer

HUD показує local time, date, tracks loaded, active tracks, mapped positions та AIR feed status.

Disclaimer показується при вході в AIR та пояснює, що система не є radar/telemetry/prediction tool.

## 30. Індикатор тривоги Харкова

Standalone frontend має окремий HUD indicator:

```text
KHARKIV CITY / COMMUNITY
```

Стани:

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

Поточний region ID:

```text
1293
```

В API він відповідає `м. Харків та Харківська територіальна громада`.

## 31. Ukraine Alarm API proxy

Browser не звертається до Ukraine Alarm API напряму. FastAPI backend робить server-side request до:

```text
https://api.ukrainealarm.com/api/v3/alerts/1293
```

Token зберігається на сервері у:

```text
/etc/tlk-map-api.env
```

з формою:

```text
UKRAINE_ALARM_TOKEN=<secret>
```

Systemd override підключає цей файл через `EnvironmentFile`.

Endpoint `/api/alarm/kharkiv` повертає спрощений payload на кшталт:

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

Token ніколи не повинен потрапляти в `index.html`, `air-mode.js` або public repository.

## 32. CORS

FastAPI дозволяє GitHub Pages origin:

```text
https://deafinicio.github.io
```

Для local development також можуть бути дозволені:

```text
http://127.0.0.1:8080
http://localhost:8080
```

## 33. Local development

У Windows:

```powershell
cd C:\air-threat-map
python -m http.server 8080
```

Відкрити:

```text
http://localhost:8080/
```

Не рекомендується тестувати через `file:///...`, оскільки browser security та fetch local assets можуть працювати інакше.

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

Публічний URL:

```text
https://deafinicio.github.io/air-threat-map/
```

## 35. DNS / sslip.io

API зараз доступний через hostname на базі `sslip.io`. Якщо browser показує `ERR_NAME_NOT_RESOLVED`, проблема може бути у локальному DNS resolver.

Робочі public DNS examples:

```text
Cloudflare: 1.1.1.1 / 1.0.0.1
Google:     8.8.8.8 / 8.8.4.4
```

Довгостроково бажано перейти на власний стабільний API hostname.

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

Перед commit frontend changes:

```powershell
node --check .\air-mode.js
git diff --check
```

Staging робити конкретно:

```bash
git add air-mode.js index.html kharkiv-ring-road.geojson README.md docs/README_UA.md docs/README_EN.md
```

Не рекомендується використовувати `git add .`, оскільки локальні backup-файли не повинні потрапляти в repository.

## 38. Ключові семантичні правила

1. Не прогнозувати фізичну траєкторію.
2. Не створювати inferred impact point.
3. Не трактувати direction target як confirmed current position.
4. Не з'єднувати unrelated messages без explicit reply.
5. Derived midpoint/centroid завжди вважати approximate visual reference.
6. Aggregate snapshots не повинні накопичуватися як незалежні одночасні live groups.
7. Terminal marker без власної геометрії використовує останній source reference branch лише як visual anchor.
8. Raw source text слід зберігати для auditing/debugging.
9. Public frontend не повинен містити API secrets.

## 39. Поточний technical debt / майбутній refactoring

Standalone `air-mode.js` історично походить із combined `mine-risk-map`, тому містить частину compatibility code і legacy naming, зокрема `mine-risk-map-*` localStorage keys та MINE placeholders.

Можливий майбутній refactoring:

- винести shared AIR engine в окремий reusable module;
- відокремити CSS від `index.html`;
- винести API host у configuration layer;
- перейти з `sslip.io` на власний domain;
- додати automated tests для parser/normalizer/snapshot semantics;
- додати versioned API contract;
- автоматизувати deployment та health checks.

---

**AIR Threat Map** залишається інформаційним засобом візуалізації source-reported data. Він не замінює офіційні системи оповіщення та не повинен використовуватися як джерело verified tactical telemetry.
